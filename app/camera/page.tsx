"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Topbar, ButtonLink, Card } from "../ui";
import { addPhoto } from "../lib/db";

// ✅ MediaPipe
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

type FacingMode = "user" | "environment";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(true);

  const [facingMode, setFacingMode] = useState<FacingMode>("user");

  // ✅ Manual Timer
  const [timerSeconds, setTimerSeconds] = useState<0 | 3 | 5 | 10>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // ✅ Auto Align / Face assist
  const [autoMode, setAutoMode] = useState(false);
  const [aligned, setAligned] = useState<boolean | null>(null); // null = unknown
  const goodFramesRef = useRef(0);
  const lastShotAtRef = useRef(0);

  // ✅ Auto Countdown (before auto-shot)
  const [autoDelaySeconds, setAutoDelaySeconds] = useState<0 | 2 | 3 | 5>(3);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoCountdownRef = useRef<number | null>(null);

  // MediaPipe refs
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Double-tap to flip camera (mobile)
  const lastTapRef = useRef<number>(0);

  function handleTapToFlip() {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    if (delta > 0 && delta < 320) toggleCamera();
    lastTapRef.current = now;
  }

  function stopStream() {
    const v = videoRef.current;
    const src = v?.srcObject;
    if (src && src instanceof MediaStream) {
      src.getTracks().forEach((t) => t.stop());
    }
    if (v) v.srcObject = null;
  }

  async function startCamera(mode: FacingMode) {
    setStarting(true);
    setError(null);

    try {
      stopStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      if (mode === "environment") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "user" } },
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }

          setFacingMode("user");
          setError("Rückkamera nicht verfügbar – auf Frontkamera gewechselt.");
          return;
        } catch {}
      }

      setError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
    } finally {
      setStarting(false);
    }
  }

  // ✅ MediaPipe init (einmal)
  useEffect(() => {
    let cancelled = false;

    async function initFaceDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        // ✅ OFFICIAL model link (.tflite)
        const modelPath =
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

        // try GPU, fallback CPU
        try {
          const fd = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: modelPath, delegate: "GPU" as any },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.6,
          });
          if (!cancelled) faceDetectorRef.current = fd;
          return;
        } catch {
          const fd = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: modelPath, delegate: "CPU" as any },
            runningMode: "VIDEO",
            minDetectionConfidence: 0.6,
          });
          if (!cancelled) faceDetectorRef.current = fd;
        }
      } catch (e) {
        console.error("Face-Assist init error:", e);
        if (!cancelled) setError("Face-Assist konnte nicht geladen werden.");
      }
    }

    initFaceDetector();

    return () => {
      cancelled = true;
      try {
        faceDetectorRef.current?.close();
      } catch {}
      faceDetectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (countdownRef.current) window.clearInterval(countdownRef.current);
      countdownRef.current = null;

      if (autoCountdownRef.current) window.clearInterval(autoCountdownRef.current);
      autoCountdownRef.current = null;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  async function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (!w || !h) {
      setError("Kamera ist noch nicht bereit. Versuch’s in 1 Sekunde nochmal.");
      return;
    }

    setSaving(true);
    setError(null);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSaving(false);
      setError("Canvas Kontext nicht verfügbar.");
      return;
    }


ctx.save();

if (facingMode === "user") {
  // Spiegeln, damit gespeichertes Foto wie Vorschau aussieht
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
}

ctx.drawImage(video, 0, 0, w, h);

ctx.restore();



    canvas.toBlob(
      async (blob) => {
        try {
          if (!blob) throw new Error("Blob ist leer");
          await addPhoto(blob);
          router.push("/");
        } catch {
          setError("Speichern hat nicht geklappt.");
          setSaving(false);
        }
      },
      "image/jpeg",
      0.92
    );
  }

  function toggleCamera() {
    // reset assist + timers so nothing auto-fires
    goodFramesRef.current = 0;
    setAligned(null);

    if (autoCountdownRef.current) window.clearInterval(autoCountdownRef.current);
    autoCountdownRef.current = null;
    setAutoCountdown(null);

    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }

  // ✅ Manual countdown then shoot
  function startCountdownAndShoot(seconds: 3 | 5 | 10) {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setError(null);
    setCountdown(seconds);

    countdownRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c === null) return null;

        if (c <= 1) {
          if (countdownRef.current) window.clearInterval(countdownRef.current);
          countdownRef.current = null;

          setTimeout(() => {
            setCountdown(null);
            takePhoto();
          }, 0);

          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  // ✅ Auto countdown then shoot (for face assist)
  function startAutoCountdownAndShoot(seconds: 2 | 3 | 5) {
    if (autoCountdownRef.current) {
      window.clearInterval(autoCountdownRef.current);
      autoCountdownRef.current = null;
    }

    setAutoCountdown(seconds);

    autoCountdownRef.current = window.setInterval(() => {
      setAutoCountdown((c) => {
        if (c === null) return null;

        if (c <= 1) {
          if (autoCountdownRef.current) window.clearInterval(autoCountdownRef.current);
          autoCountdownRef.current = null;

          setTimeout(() => {
            setAutoCountdown(null);
            takePhoto();
          }, 0);

          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  // ✅ Face assist loop (throttled)
  useEffect(() => {
    if (!autoMode) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      goodFramesRef.current = 0;
      setAligned(null);

      if (autoCountdownRef.current) window.clearInterval(autoCountdownRef.current);
      autoCountdownRef.current = null;
      setAutoCountdown(null);

      return;
    }

    function loop() {
      const video = videoRef.current;
      const fd = faceDetectorRef.current;

      if (!video || !fd) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // must be ready; also pause detection while countdowns run
      if (!vw || !vh || starting || saving || countdown !== null || autoCountdown !== null) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // only new frames
      if (video.currentTime === lastVideoTimeRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastVideoTimeRef.current = video.currentTime;

      const wrapper = video.parentElement as HTMLDivElement | null;
      if (!wrapper) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const rect = wrapper.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      // objectFit: cover mapping
      const scale = Math.max(W / vw, H / vh);
      const dispW = vw * scale;
      const dispH = vh * scale;
      const offsetX = (W - dispW) / 2;
      const offsetY = (H - dispH) / 2;

      // Head circle (same as overlay)
      const circleCx = W / 2;
      const circleCy = 60 + 45;
      const circleR = 45;

      let ok = false;

      try {
        const res = fd.detectForVideo(video, performance.now());
        const det = res?.detections?.[0];
        const bb = det?.boundingBox;

        if (bb) {
          const fx = bb.originX + bb.width / 2;
          const fy = bb.originY + bb.height / 2;

          let x = fx * scale + offsetX;
          const y = fy * scale + offsetY;

          // mirror x for user-facing (so feedback matches what you see)
          // if (facingMode === "user") x = W - x;

          const faceW = bb.width * scale;

          const dist = Math.hypot(x - circleCx, y - circleCy);
          const centerOK = dist <= circleR * 0.8; // slightly stricter
          const sizeOK = faceW >= circleR * 1.25 && faceW <= circleR * 2.3;

          ok = centerOK && sizeOK;
        }
      } catch {
        ok = false;
      }

      setAligned(ok);

      if (ok) goodFramesRef.current += 1;
      else goodFramesRef.current = 0;

      const now = Date.now();
      const cooldownMs = 3000;

      const stableEnough = goodFramesRef.current >= 12;
      const cooldownOk = now - lastShotAtRef.current > cooldownMs;

      if (stableEnough && cooldownOk && !saving && !starting && countdown === null && autoCountdown === null) {
        lastShotAtRef.current = now;
        goodFramesRef.current = 0;

        if (autoDelaySeconds === 0) {
          takePhoto();
        } else {
          startAutoCountdownAndShoot(autoDelaySeconds);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [autoMode, facingMode, saving, starting, countdown, autoCountdown, autoDelaySeconds]);

  // ✅ Stronger visual feedback for head circle
  const headBorder =
    autoMode && aligned !== null
      ? aligned
        ? "rgba(0,255,120,0.95)"
        : "rgba(255,70,70,0.95)"
      : "var(--calendar-today-border)";

  const headGlow =
    autoMode && aligned !== null
      ? aligned
        ? "0 0 0 4px rgba(0,255,120,0.25), 0 0 18px rgba(0,255,120,0.55)"
        : "0 0 0 4px rgba(255,70,70,0.18), 0 0 16px rgba(255,70,70,0.45)"
      : "none";

  return (
    <Container>
      <Topbar title="Kamera" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {error ? <p style={{ margin: 0, color: "red" }}>{error}</p> : null}

        {/* Video + Overlay Guide */}
        <div
          onTouchEnd={handleTapToFlip}
          onClick={(e) => {
            if ((e as any).detail === 2) toggleCamera();
          }}
          onDoubleClick={toggleCamera}
          style={{
            marginTop: error ? 10 : 0,
            position: "relative",
            width: "100%",
            height: 420,
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            opacity: starting ? 0.7 : 1,
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
              pointerEvents: "none",
            }}
          />

          {/* Kamera wechseln */}
          <button
            onClick={toggleCamera}
            disabled={saving || starting || countdown !== null || autoCountdown !== null}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 20,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(0,0,0,0.45)",
              color: "var(--foreground)",
              cursor: saving || starting || countdown !== null || autoCountdown !== null ? "not-allowed" : "pointer",
              fontSize: 14,
              opacity: saving || starting || countdown !== null || autoCountdown !== null ? 0.6 : 1,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
            aria-label="Kamera wechseln"
            title="Kamera wechseln"
          >
            ↺ Kamera
          </button>

          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: autoMode ? 0.75 : 0.55,
            }}
          >
            {/* Rahmen */}
            <div
              style={{
                position: "absolute",
                inset: 16,
                borderRadius: 16,
                border: "2px solid var(--calendar-today-border)",
              }}
            />

            {/* Center-Linie */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                width: 2,
                transform: "translateX(-1px)",
                background: "rgba(255,255,255,0.35)",
              }}
            />

            {/* Head-Kreis */}
            <div
              style={{
                position: "absolute",
                top: 60,
                left: "50%",
                width: 90,
                height: 90,
                transform: "translateX(-50%)",
                borderRadius: "50%",
                border: `3px solid ${headBorder}`,
                boxShadow: headGlow,
                opacity: autoMode ? 0.95 : 0.55,
              }}
            />

            {/* Schulterlinie */}
            <div
              style={{
                position: "absolute",
                top: 170,
                left: "50%",
                width: 220,
                height: 2,
                transform: "translateX(-50%)",
                background: "rgba(255,255,255,0.35)",
              }}
            />
          </div>

          {starting && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              Kamera startet…
            </div>
          )}

          {/* Manual Countdown Overlay */}
          {countdown !== null && countdown > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.35)",
                color: "rgba(255,255,255,0.95)",
                fontSize: 64,
                fontWeight: 700,
                zIndex: 30,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              {countdown}
            </div>
          )}

          {/* Auto Countdown Overlay */}
          {autoCountdown !== null && autoCountdown > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.35)",
                color: "rgba(255,255,255,0.95)",
                fontSize: 64,
                fontWeight: 700,
                zIndex: 31,
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              {autoCountdown}
            </div>
          )}
        </div>

        {/* Auto Mode Button */}
        <button
          onClick={() => {
            goodFramesRef.current = 0;
            setAligned(null);

            if (autoCountdownRef.current) window.clearInterval(autoCountdownRef.current);
            autoCountdownRef.current = null;
            setAutoCountdown(null);

            setAutoMode((v) => !v);
          }}
          disabled={saving || starting || countdown !== null || autoCountdown !== null}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            cursor: saving || starting || countdown !== null || autoCountdown !== null ? "not-allowed" : "pointer",
            fontSize: 16,
            opacity: saving || starting || countdown !== null || autoCountdown !== null ? 0.6 : 1,
          }}
        >
          🎯 Auto: {autoMode ? "An" : "Aus"}
        </button>

        {/* Auto Countdown Selector */}
        <button
          onClick={() => {
            setAutoDelaySeconds((s) => (s === 0 ? 2 : s === 2 ? 3 : s === 3 ? 5 : 0));
          }}
          disabled={saving || starting || countdown !== null || autoCountdown !== null || !autoMode}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            cursor:
              saving || starting || countdown !== null || autoCountdown !== null || !autoMode
                ? "not-allowed"
                : "pointer",
            fontSize: 16,
            opacity: saving || starting || countdown !== null || autoCountdown !== null || !autoMode ? 0.6 : 1,
          }}
        >
          ⏳ Auto-Countdown: {autoDelaySeconds === 0 ? "Aus" : `${autoDelaySeconds}s`}
          {!autoMode ? " (Auto aus)" : ""}
        </button>

        {/* Manual Timer Button */}
        <button
          onClick={() => {
            setTimerSeconds((t) => (t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0));
          }}
          disabled={saving || starting || countdown !== null || autoCountdown !== null || autoMode}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            cursor:
              saving || starting || countdown !== null || autoCountdown !== null || autoMode
                ? "not-allowed"
                : "pointer",
            fontSize: 16,
            opacity: saving || starting || countdown !== null || autoCountdown !== null || autoMode ? 0.6 : 1,
          }}
        >
          ⏱ Timer: {timerSeconds === 0 ? "Aus" : `${timerSeconds}s`}
          {autoMode ? " (deaktiviert)" : ""}
        </button>

        {/* Foto-Button */}
        <button
          onClick={() => {
            if (saving || starting) return;
            if (countdown !== null || autoCountdown !== null) return;

            if (timerSeconds === 0) takePhoto();
            else startCountdownAndShoot(timerSeconds);
          }}
          disabled={saving || starting || countdown !== null || autoCountdown !== null}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            cursor: saving || starting || countdown !== null || autoCountdown !== null ? "not-allowed" : "pointer",
            fontSize: 16,
            opacity: saving || starting || countdown !== null || autoCountdown !== null ? 0.6 : 1,
          }}
        >
          {saving
            ? "Speichere..."
            : countdown !== null
              ? `Foto in ${countdown}...`
              : autoCountdown !== null
                ? `Auto-Foto in ${autoCountdown}...`
                : "Foto machen"}
        </button>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Card>
    </Container>
  );
}
