"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deletePhoto, getAllPhotos, type PhotoEntry } from "./lib/db";
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

export default function Home() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);

  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [hasTodayPhoto, setHasTodayPhoto] = useState(false);

  const latestPhoto = useMemo(() => (photos.length > 0 ? photos[0] : null), [photos]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);


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
    const today = dayKey(new Date());
    const todayHas = photos.some((p) => dayKey(new Date(p.date)) === today);
    setHasTodayPhoto(todayHas);
  }, [photos]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!latestPhoto) {
      setLatestUrl(null);
      return;
    }
    const url = URL.createObjectURL(latestPhoto.blob);
    setLatestUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [latestPhoto]);

  async function handleDeleteLatest() {
    if (!latestPhoto) return;
    const ok = confirm("Letztes Foto wirklich löschen?");
    if (!ok) return;
    await deletePhoto(latestPhoto.id);
    await refresh();
  }
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
  
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);
  

  return (
    <Container>
      <Topbar
        title={
          <a href="/" style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/logo.png"
              alt="LetsGo"
              style={{
                height: 40,
                objectFit: "contain",
                display: "block",
              }}
            />
          </a>
        }
        right={
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{streak}</div>
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

      <Card>
        {!latestPhoto || !latestUrl ? (
          <p style={{ margin: 0, opacity: 0.8 }}>Noch kein Foto. Mach dein erstes 🙂</p>
        ) : (
          <>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              Letztes Foto:{" "}
              {new Date(latestPhoto.date).toLocaleDateString()}{" "}
              {new Date(latestPhoto.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>

            <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
              <img
                src={latestUrl}
                alt="latest progress"
                style={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 12,
                  display: "block",
                }}
              />
            </div>

            <button
              onClick={handleDeleteLatest}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Letztes Foto löschen
            </button>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                maxWidth: 420,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <a
                href="/timelapse"
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  textAlign: "center",
                  fontWeight: 500,
                  textDecoration: "none",
                  color: "white",
                }}
              >
                Timelapse ansehen
              </a>

              <a
                href="/camera"
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "white",
                  color: "black",
                  fontWeight: 600,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                Neues Foto
              </a>
            </div>
          </>
        )}
      </Card>
    </Container>
  );
}
