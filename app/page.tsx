"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "./lib/db";
import { Container, Topbar, ButtonLink, Card } from "./ui";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayKeyDaysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

function computeStats(all: PhotoEntry[]) {
  const uniqueDays = new Set(all.map((p) => dayKey(new Date(p.date))));
  const totalDays = uniqueDays.size;

  let streak = 0;
  while (uniqueDays.has(dayKeyDaysAgo(streak))) streak++;

  return { totalDays, streak };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type ThemeMode = "light" | "dark";

export default function Home() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [hasTodayPhoto, setHasTodayPhoto] = useState(false);

  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [firstUrl, setFirstUrl] = useState<string | null>(null);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);

  const [themeDark, setThemeDark] = useState(false);

  // ✅ WICHTIG: immer sortieren (neueste zuerst), damit links/rechts stimmt
  const sortedPhotos = useMemo(() => {
    const copy = [...photos];
    copy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return copy;
  }, [photos]);

  const latestPhoto = useMemo(
    () => (sortedPhotos.length > 0 ? sortedPhotos[0] : null),
    [sortedPhotos]
  );

  const firstPhoto = useMemo(
    () => (sortedPhotos.length > 0 ? sortedPhotos[sortedPhotos.length - 1] : null),
    [sortedPhotos]
  );

  // Center-reveal split (0..100). Start: 50% (beide Hälften sichtbar)
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const compareRef = useRef<HTMLDivElement | null>(null);

  // ✅ Theme
  const [theme, setTheme] = useState<ThemeMode>("light");

  function applyTheme(next: ThemeMode) {
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", next);
  }

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

  // LocalStorage Reminder-Time
  useEffect(() => {
    const rt = localStorage.getItem("reminder_time");
    setReminderTime(rt);
  }, []);

  useEffect(() => {
    // initial state aus <html class="dark"> lesen
    setThemeDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setThemeDark(next);
  }

  // ✅ Theme beim Start laden
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as ThemeMode | null) ?? null;

    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
      return;
    }

    // Fallback: System preference
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    applyTheme(prefersDark ? "dark" : "light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check: heute foto?
  useEffect(() => {
    const today = dayKey(new Date());
    const todayHas = sortedPhotos.some((p) => dayKey(new Date(p.date)) === today);
    setHasTodayPhoto(todayHas);
  }, [sortedPhotos]);

  // Auto-refresh wenn Home wieder sichtbar wird
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URLs erzeugen + sauber revoken
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

  // Menü schließt bei Klick außerhalb
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!menuOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const menuRoot = document.getElementById("home-menu-root");
      if (menuRoot && !menuRoot.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [menuOpen]);

  function setSplitFromClientX(clientX: number) {
    const el = compareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSplit(clamp(pct, 0, 100));
  }

  // Pointer Events
  function onPointerDown(e: React.PointerEvent) {
    if (!compareRef.current) return;
    setDragging(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setSplitFromClientX(e.clientX);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setSplitFromClientX(e.clientX);
  }

  function onPointerUp(e: React.PointerEvent) {
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }

  // Touch fallback
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    setDragging(true);
    setSplitFromClientX(t.clientX);
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    const t = e.touches[0];
    if (!t) return;
    setSplitFromClientX(t.clientX);
  }
  function onTouchEnd() {
    setDragging(false);
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
          <div id="home-menu-root" style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
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
                  minWidth: 220,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  padding: 10,
                  display: "grid",
                  gap: 10,
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

      {/* Streak Card */}
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

      {/* Reminder */}
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

      {/* Center-Reveal Compare (edge-to-edge) */}
      {sortedPhotos.length === 0 ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.8 }}>Noch kein Foto. Mach dein erstes 🙂</p>
        </Card>
      ) : (
        <div
          style={{
            marginLeft: -16,
            marginRight: -16,
            marginTop: 14,
          }}
        >
          <div
            ref={compareRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              position: "relative",
              width: "100%",
              height: "56vh",
              minHeight: 420,
              background: "#000",
              overflow: "hidden",
              touchAction: "none",
              userSelect: "none",
            }}
            aria-label="Vorher/Nachher Vergleich"
          >
            {/* Unten: Start (ältestes) */}
            {firstUrl && (
              <img
                src={firstUrl}
                alt="Start"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}

            {/* Oben: Heute (neuestes) */}
            {latestUrl && (
              <img
                src={latestUrl}
                alt="Heute"
                draggable={false}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  clipPath: `inset(0 0 0 ${split}%)`,
                }}
              />
            )}

            {/* Labels */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 12,
                right: 12,
                zIndex: 3,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 12,
                color: "white",
                opacity: 0.95,
                textShadow: "0 1px 12px rgba(0,0,0,0.75)",
              }}
            >
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                Start{" "}
                {firstPhoto ? `• ${new Date(firstPhoto.date).toLocaleDateString()}` : ""}
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                Heute{" "}
                {latestPhoto ? `• ${new Date(latestPhoto.date).toLocaleDateString()}` : ""}
              </div>
            </div>

            {/* Verlauf oben */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 110,
                zIndex: 2,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))",
              }}
            />

            {/* Split-Line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${split}%`,
                width: 2,
                transform: "translateX(-1px)",
                background: "rgba(255,255,255,0.9)",
                zIndex: 4,
                boxShadow: "0 0 18px rgba(0,0,0,0.55)",
              }}
            />

            {/* Handle */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${split}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              }}
              aria-hidden="true"
            >
              ↔
            </div>

            {/* Hint unten */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 10,
                display: "flex",
                justifyContent: "center",
                zIndex: 6,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.85,
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  textShadow: "0 1px 10px rgba(0,0,0,0.6)",
                }}
              >
                Zieh nach links/rechts
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 14 }}>
  <ButtonLink href="/camera">Foto machen</ButtonLink>
</div>
    </Container>
  );
}
