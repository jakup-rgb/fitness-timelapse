"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPhotos, getNote, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TimelapsePage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300); // ms pro Bild

  const [showNote, setShowNote] = useState(true);
  const [noteText, setNoteText] = useState<string | null>(null);

  // Fotos laden
  useEffect(() => {
    (async () => {
      const all = await getAllPhotos();
      setPhotos(all);
    })();
  }, []);

  // Blob → URLs
  useEffect(() => {
    const next = photos.map((p) => URL.createObjectURL(p.blob));
    setUrls(next);

    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  function prevFrame() {
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  }

  function nextFrame() {
    setIndex((i) => (i + 1) % urls.length);
  }

  // Slideshow (läuft einmal bis Ende)
  useEffect(() => {
    if (urls.length === 0 || !playing) return;

    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= urls.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [urls, playing, speed]);

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const todayKey = useMemo(() => localDayKey(new Date()), []);

const currentDayKey = useMemo(() => {
  const p = photos[index];
  if (!p) return null;
  return localDayKey(new Date(p.date));
}, [photos, index]);

const isTodayFrame = currentDayKey === todayKey;

// Notiz nur laden, wenn aktuelles Bild = heute
useEffect(() => {
  (async () => {
    if (!isTodayFrame) {
      setNoteText(null);
      return;
    }
    const n = await getNote(todayKey);
    setNoteText(n?.text?.trim() ? n.text : null);
  })();
}, [isTodayFrame, todayKey]);


  return (
    <Container>
      <Topbar title="Timelapse" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {urls.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.8 }}>Noch keine Fotos.</p>
        ) : (
          <>
            <div
              style={{
                width: "100%",
                height: 420,
                borderRadius: 12,
                background: "#000",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={urls[index]}
                alt="timelapse"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              {index + 1} / {urls.length}
              {currentDayKey ? ` • ${new Date(currentDayKey).toLocaleDateString("de-DE")}` : ""}
            </p>

            {/* Toggle Notiz */}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowNote((v) => !v)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {showNote ? "Notiz ausblenden" : "Notiz einblenden"}
              </button>

              <a
                href="/notes"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Notizen öffnen
              </a>
            </div>

            {/* Notiz Anzeige */}
            {showNote && isTodayFrame && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
                  Notiz {currentDayKey ? `(${new Date(currentDayKey).toLocaleDateString("de-DE")})` : ""}
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4, opacity: noteText ? 1 : 0.7 }}>
                  {noteText ?? "Keine Notiz für diesen Tag."}
                </div>
              </div>
            )}

            {/* Scrub Slider */}
            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                Frame auswählen
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, urls.length - 1)}
                step={1}
                value={index}
                onChange={(e) => {
                  setPlaying(false);
                  setIndex(Number(e.target.value));
                }}
                style={{ width: "100%" }}
              />
            </label>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={prevFrame}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                ⏮️
              </button>

              <button
                onClick={() => {
                  if (!playing && index >= urls.length - 1) setIndex(0);
                  setPlaying((p) => !p);
                }}
                style={{
                  flex: 2,
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {playing ? "Pause" : "Play"}
              </button>

              <button
                onClick={nextFrame}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                ⏭️
              </button>
            </div>

            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                Geschwindigkeit
              </div>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ fontSize: 12, opacity: 0.6 }}>{speed} ms</div>
            </label>
          </>
        )}
      </Card>
    </Container>
  );
}
