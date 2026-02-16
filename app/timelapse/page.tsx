"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export default function TimelapsePage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300); // ms pro Bild

  // Fotos laden
  useEffect(() => {
    (async () => {
      const all = await getAllPhotos(); // kommt neueste -> älteste
      const asc = [...all].reverse(); // für Timelapse: älteste -> neueste
      setPhotos(asc);

      // Default: ganze Range
      setRangeStart(0);
      setRangeEnd(Math.max(0, asc.length - 1));
      setIndex(0);
    })();
  }, []);

  // Gefilterte Photos nach Range (inklusive)
  const rangedPhotos = useMemo(() => {
    if (photos.length === 0) return [];
    const s = Math.min(rangeStart, rangeEnd);
    const e = Math.max(rangeStart, rangeEnd);
    return photos.slice(s, e + 1);
  }, [photos, rangeStart, rangeEnd]);

  const rangedStartAbs = useMemo(() => Math.min(rangeStart, rangeEnd), [rangeStart, rangeEnd]);
  const rangedEndAbs = useMemo(() => Math.max(rangeStart, rangeEnd), [rangeStart, rangeEnd]);

  // URLs nur für rangedPhotos erzeugen + sauber revoken
  useEffect(() => {
    const next = rangedPhotos.map((p) => URL.createObjectURL(p.blob));
    setUrls(next);

    // Index innerhalb der Range halten
    setIndex((i) => {
      if (next.length === 0) return 0;
      return Math.max(0, Math.min(i, next.length - 1));
    });

    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [rangedPhotos]);

  // Prev/Next innerhalb Range
  function prevFrame() {
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function nextFrame() {
    setPlaying(false);
    setIndex((i) => Math.min(Math.max(0, urls.length - 1), i + 1));
  }

  // Slideshow (stoppt am Ende der Range)
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

  // Quick Range (letzte N Bilder / Tage-ähnlich)
  function setLastN(n: number) {
    if (photos.length === 0) return;
    const end = photos.length - 1;
    const start = Math.max(0, end - (n - 1));
    setPlaying(false);
    setRangeStart(start);
    setRangeEnd(end);
    setIndex(0);
  }

  // Hilfetexte
  const startLabel = useMemo(() => {
    if (photos.length === 0) return "";
    return fmtDate(photos[rangedStartAbs].date);
  }, [photos, rangedStartAbs]);

  const endLabel = useMemo(() => {
    if (photos.length === 0) return "";
    return fmtDate(photos[rangedEndAbs].date);
  }, [photos, rangedEndAbs]);

  return (
    <Container>
      <Topbar title="Timelapse" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {photos.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.8 }}>Noch keine Fotos.</p>
        ) : (
          <>
            {/* Viewer */}
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
              {urls.length > 0 && (
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
              )}
            </div>

            <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
              Frame: {index + 1} / {urls.length}{" "}
              <span style={{ opacity: 0.6 }}>
                (Range: {rangedStartAbs + 1}–{rangedEndAbs + 1} von {photos.length})
              </span>
            </p>

            {/* Range Picker */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Von: <b>{startLabel}</b>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Bis: <b>{endLabel}</b>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <label style={{ display: "block" }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Start</div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, photos.length - 1)}
                    step={1}
                    value={rangeStart}
                    onChange={(e) => {
                      setPlaying(false);
                      const v = Number(e.target.value);
                      setRangeStart(v);
                      // wenn Start über Ende: Ende nachziehen
                      if (v > rangeEnd) setRangeEnd(v);
                      setIndex(0);
                    }}
                    style={{ width: "100%" }}
                  />
                </label>

                <label style={{ display: "block" }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Ende</div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, photos.length - 1)}
                    step={1}
                    value={rangeEnd}
                    onChange={(e) => {
                      setPlaying(false);
                      const v = Number(e.target.value);
                      setRangeEnd(v);
                      // wenn Ende unter Start: Start nachziehen
                      if (v < rangeStart) setRangeStart(v);
                      setIndex(0);
                    }}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>

              {/* Quick Buttons */}
              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setLastN(7)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Letzte 7
                </button>
                <button
                  onClick={() => setLastN(10)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Letzte 10
                </button>
                <button
                  onClick={() => setLastN(30)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Letzte 30
                </button>
              </div>
            </div>

            {/* Controls */}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={prevFrame}
                disabled={urls.length === 0}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                ⏮️
              </button>

              <button
                onClick={() => {
                  if (!playing && index >= urls.length - 1) {
                    setIndex(0); // von Range-Start
                  }
                  setPlaying((p) => !p);
                }}
                disabled={urls.length === 0}
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "white",
                  color: "black",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {playing ? "Pause" : "Play"}
              </button>

              <button
                onClick={nextFrame}
                disabled={urls.length === 0}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                ⏭️
              </button>
            </div>

            {/* Speed */}
            <label style={{ display: "block", marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Geschwindigkeit</div>
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
