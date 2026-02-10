"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function Home() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [hasTodayPhoto, setHasTodayPhoto] = useState(false);

  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const [firstUrl, setFirstUrl] = useState<string | null>(null);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);

  const latestPhoto = useMemo(() => (photos.length > 0 ? photos[0] : null), [photos]);
  const firstPhoto = useMemo(
    () => (photos.length > 0 ? photos[photos.length - 1] : null),
    [photos]
  );

  async function refresh() {
    const all = await getAllPhotos(); // neueste -> älteste
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

  // check: heute foto?
  useEffect(() => {
    const today = dayKey(new Date());
    const todayHas = photos.some((p) => dayKey(new Date(p.date)) === today);
    setHasTodayPhoto(todayHas);
  }, [photos]);

  // Auto-refresh wenn Home wieder sichtbar wird
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
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
          <div style={{ position: "relative" }}>
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

      {/* Streak Card (bleibt wie gehabt) */}
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
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>{streak}</div>
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

      {/* Full-bleed Bildbereich (bis zum Rand, keine Box) */}
      {photos.length === 0 ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.8 }}>Noch kein Foto. Mach dein erstes 🙂</p>
        </Card>
      ) : (
        <div
          style={{
            // Full-bleed trick: egal wie viel Padding dein Container hat
            width: "100vw",
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              paddingLeft: 10,
              paddingRight: 10,
              // macht den Bereich groß (fast untere Hälfte)
              height: "min(62vh, 640px)",
            }}
          >
            {/* Erstes Foto */}
            <div
              style={{
                position: "relative",
                borderRadius: 22,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.45)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  zIndex: 2,
                }}
              >
                Start{" "}
                {firstPhoto ? `• ${new Date(firstPhoto.date).toLocaleDateString()}` : ""}
              </div>

              {firstUrl ? (
                <img
                  src={firstUrl}
                  alt="first"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </div>

            {/* Neuestes Foto */}
            <div
              style={{
                position: "relative",
                borderRadius: 22,
                overflow: "hidden",
                background: "#000",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.45)",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 12,
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  zIndex: 2,
                }}
              >
                Heute{" "}
                {latestPhoto ? `• ${new Date(latestPhoto.date).toLocaleDateString()}` : ""}
              </div>

              {latestUrl ? (
                <img
                  src={latestUrl}
                  alt="latest"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
