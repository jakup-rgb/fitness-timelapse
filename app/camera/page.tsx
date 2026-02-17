"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Topbar, ButtonLink, Card } from "../ui";
import { addPhoto } from "../lib/db";

type FacingMode = "user" | "environment";

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(true);

  const [facingMode, setFacingMode] = useState<FacingMode>("user");

  // Double-tap to flip camera (mobile)
  const lastTapRef = useRef<number>(0);

  function handleTapToFlip() {
    const now = Date.now();
    const delta = now - lastTapRef.current;

    // double-tap within ~320ms
    if (delta > 0 && delta < 320) {
      toggleCamera();
    }
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
        video: {
          facingMode: { ideal: mode }, // "user" (front) oder "environment" (back)
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari braucht manchmal play() nach srcObject setzen
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      // Fallback: wenn "environment" nicht geht, probier "user"
      if (mode === "environment") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "user" } }, // ✅ fallback auf Frontkamera
            audio: false,
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }

          setFacingMode("user");
          setError("Rückkamera nicht verfügbar – auf Frontkamera gewechselt.");
          return;
        } catch {
          // weiter unten Fehler setzen
        }
      }

      setError("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    startCamera(facingMode);

    return () => {
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

    ctx.drawImage(video, 0, 0, w, h);

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
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }

  return (
    <Container>
      <Topbar title="Kamera" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {error ? <p style={{ margin: 0, color: "red" }}>{error}</p> : null}

        {/* Video + Overlay Guide */}
        <div
          onTouchEnd={handleTapToFlip}
          onClick={(e) => {
            // iOS fires "click" events after taps; detail===2 catches double-tap as well
            if ((e as any).detail === 2) toggleCamera();
          }}
          onDoubleClick={toggleCamera} // desktop
          style={{
            marginTop: error ? 10 : 0,
            position: "relative",
            width: "100%",
            height: 420,
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            opacity: starting ? 0.7 : 1,

            // helps mobile: avoid double-tap zoom & make taps reliable
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
              // Frontkamera fühlt sich natürlicher an (Spiegel).
              transform: facingMode === "user" ? "scaleX(-1)" : "none",
              // wichtig: damit der Wrapper die taps bekommt (iOS frisst sonst oft events am video)
              pointerEvents: "none",
            }}
          />

          {/* ✅ Kamera-Wechsel Button als Overlay (immer sichtbar auf Handy) */}
          <button
            onClick={toggleCamera}
            disabled={saving || starting}
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
              cursor: saving || starting ? "not-allowed" : "pointer",
              fontSize: 14,
              opacity: saving || starting ? 0.6 : 1,
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
              opacity: 0.55,
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
                border: "2px solid var(--calendar-today-border)",
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
        </div>

        {/* Foto-Button */}
        <button
          onClick={takePhoto}
          disabled={saving || starting}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "transparent",
            cursor: saving || starting ? "not-allowed" : "pointer",
            fontSize: 16,
            opacity: saving || starting ? 0.6 : 1,
          }}
        >
          {saving ? "Speichere..." : "Foto machen"}
        </button>

        {/* verstecktes Canvas für den Snapshot */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </Card>
    </Container>
  );
}
