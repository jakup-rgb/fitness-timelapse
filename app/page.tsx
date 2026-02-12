"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "./lib/db";
import { Container, Topbar, ButtonLink, Card } from "./ui";

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKeyDaysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return dayKeyLocal(d);
}

function computeStats(all: PhotoEntry[]) {
  const uniqueDays = new Set(all.map((p) => dayKeyLocal(new Date(p.date))));
  const totalDays = uniqueDays.size;

  let streak = 0;
  while (uniqueDays.has(dayKeyDaysAgo(streak))) streak++;

  return { totalDays, streak };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Home() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [hasTodayPhoto, setHasTodayPhoto] = useState(false);

  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [firstUrl, setFirstUrl] = useState<string | null>(null);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);

  const latestPhoto = useMemo(
    () => (photos.length > 0 ? photos[0] : null),
    [photos]
  );
  const firstPhoto = useMemo(
    () => (photos.length > 0 ? photos[photos.length - 1] : null),
    [photos]
  );

  async function refresh() {
    const all = await getAllPhotos();
    setPhotos(all);

    const stats = computeStats(all);
    setTotalDays(stats.totalDays);
    setStreak(stats.streak);
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const rt = localStorage.getItem("reminder_time");
    setReminderTime(rt);
  }, []);

  useEffect(() => {
    const today = dayKeyLocal(new Date());
    const todayHas = photos.some((p) => dayKeyLocal(new Date(p.date)) === today);
    setHasTodayPhoto(todayHas);
  }, [photos]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstUrl) URL.revokeObjectURL(firstUrl);
    if (latestUrl) URL.revokeObjectURL(latestUrl);

    const nextFirst = firstPhoto ? URL.createObjectURL(firstPhoto.blob) : null;
    const nextLatest = latestPhoto ? URL.createObjectURL(latestPhoto.blob) : null;

    setFirstUrl(nextFirst);
    setLatestUrl(nextLatest);

    return () => {
      if (nextFirst) URL.revokeObjectURL(nextFirst);
      if (nextLatest) URL.revokeObjectURL(nextLatest);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPhoto, latestPhoto]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-menu-root]")) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // --- Compare Slider state ---
  const [pos, setPos] = useState(50); // 0..100
  const boxRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  function updatePos(clientX: number) {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(clamp(p, 0, 100));
  }

  // Drag nur am Handle
  function onHandleDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    updatePos(e.clientX);
  }
  function onHandleMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    updatePos(e.clientX);
  }
  function onHandleUp(e: React.PointerEvent) {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  return (
    <Container>
      <Topbar
        title={
          <a href="/" style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/logo.png"
              alt="LetsGo"
              style={{ height: 40, objectFit: "contain", display: "block" }}
            />
          </a>
        }
        right={
          <div style={{ position: "relative" }} data-menu-root>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
                color: "white",
              }}
              aria-label="Menü"
            >
              ☰
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  minWidth: 180,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "rgba(20,20,20,0.95)",
                  padding: 10,
                  display: "grid",
                  gap: 8,
                  zIndex: 50,
                }}
              >
                <ButtonLink href="/settings">Einstellungen</ButtonLink>
                <ButtonLink href="/camera">Kamera</ButtonLink>
                <ButtonLink href="/add">Upload</ButtonLink>
                <ButtonLink href="/timelapse">Timelapse</ButtonLink>
              </div>
            )}
          </div>
        }
      />

      <Card>
        <div style={{ textAlign: "center" }}>
          {streak === 0 ? (
            <div style={{ fontSize: 22, fontWeight: 700 }}>Tage Streak</div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "baseline",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
                {streak}
              </div>
              <div style={{ fontSize: 18, opacity: 0.85 }}>Tage Streak</div>
            </div>
          )}

          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
            {totalDays} Tage insgesamt dokumentiert
          </div>
        </div>
      </Card>

      {reminderTime && !hasTodayPhoto && (
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Reminder</div>
          <div style={{ opacity: 0.8 }}>
            Heute fehlt noch dein Foto 🙂 (eingestellt: {reminderTime})
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ButtonLink href="/camera">Jetzt Foto machen</ButtonLink>
            <ButtonLink href="/settings">Uhrzeit ändern</ButtonLink>
          </div>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.8 }}>Noch kein Foto. Mach dein erstes 🙂</p>
        </Card>
      ) : (
        <div style={{ marginLeft: -16, marginRight: -16, marginTop: 14 }}>
          <div
            ref={boxRef}
            style={{
              position: "relative",
              height: "60vh",
              minHeight: 440,
              background: "#000",
              overflow: "hidden",
              touchAction: "none",
            }}
          >
            {/* Under: Start */}
            {firstUrl && (
              <img
                src={firstUrl}
                alt="start"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  userSelect: "none",
                }}
              />
            )}

            {/* Over: Heute (Reveal per Clip) */}
            {latestUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${pos}%`,
                  overflow: "hidden",
                }}
              >
                <img
                  src={latestUrl}
                  alt="heute"
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    userSelect: "none",
                  }}
                />
              </div>
            )}

            {/* Labels */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                zIndex: 5,
              }}
            >
              Start
            </div>
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                zIndex: 5,
              }}
            >
              Heute
            </div>

            {/* Divider Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${pos}%`,
                transform: "translateX(-1px)",
                width: 2,
                background: "rgba(255,255,255,0.9)",
                zIndex: 6,
              }}
            />

            {/* Handle (nur dieses Element ist draggable) */}
            <div
              onPointerDown={onHandleDown}
              onPointerMove={onHandleMove}
              onPointerUp={onHandleUp}
              onPointerCancel={onHandleUp}
              style={{
                position: "absolute",
                left: `${pos}%`,
                top: "38%",
                transform: "translate(-50%, -50%)",
                width: 54,
                height: 54,
                borderRadius: 999,
                background: "rgba(0,0,0,0.55)",
                border: "1px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                zIndex: 7,
                cursor: dragging.current ? "grabbing" : "grab",
                touchAction: "none",
              }}
              aria-label="Slider ziehen"
            >
              ⇆
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.45)",
                color: "white",
                fontSize: 12,
                opacity: 0.85,
                zIndex: 5,
              }}
            >
              Handle ziehen
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
        <a
          href="/next"
          style={{
            padding: "16px 32px",
            borderRadius: 999,
            background: "white",
            color: "black",
            fontWeight: 800,
            fontSize: 16,
            textDecoration: "none",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          Weiter →
        </a>
      </div>
    </Container>
  );
}
