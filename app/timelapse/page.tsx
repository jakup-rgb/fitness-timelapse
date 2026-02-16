"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TimelapsePage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [urls, setUrls] = useState<string[]>([]);

  // Timelapse läuft besser chronologisch: alt -> neu
  const photosChrono = useMemo(() => {
    const copy = [...photos];
    copy.reverse(); // weil getAllPhotos() neueste -> älteste liefert
    return copy;
  }, [photos]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);

  // Bereichsauswahl (Indices in photosChrono/urls)
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(0);

  // Fotos laden
  useEffect(() => {
    (async () => {
      const all = await getAllPhotos();
      setPhotos(all);
    })();
  }, []);

  // Blob -> URLs (chronologisch passend)
  useEffect(() => {
    const next = photosChrono.map((p) => URL.createObjectURL(p.blob));
    setUrls(next);

    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photosChrono]);

  // Default Range setzen (z.B. letzte 10 Fotos)
  useEffect(() => {
    const len = photosChrono.length;
    if (len === 0) return;

    const defaultStart = Math.max(0, len - 10);
    const defaultEnd = len - 1;

    setStartIdx(defaultStart);
    setEndIdx(defaultEnd);

    // Index in den Bereich setzen (z.B. auf Start)
    setIndex(defaultStart);
    setPlaying(false);
  }, [photosChrono.length]); // nur wenn Anzahl sich ändert

  // Wenn Range angepasst wird: Index sauber halten
  useEffect(() => {
    if (urls.length === 0) return;
    setIndex((i) => clamp(i, startIdx, endIdx));
    // wenn Range geändert wird, stoppen wir lieber (fühlt sich sauberer an)
    setPlaying(false);
  }, [startIdx, endIdx, urls.length]);

  function prevFrame() {
    setIndex((i) => clamp(i - 1, startIdx, endIdx));
  }

  function nextFrame() {
    setIndex((i) => clamp(i + 1, startIdx, endIdx));
  }

  // Slideshow nur im Bereich [startIdx..endIdx]
  useEffect(() => {
    if (urls.length === 0 || !playing) return;

    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= endIdx) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [urls.length, playing, speed, endIdx]);

  const startLabel = photosChrono[startIdx]?.date ? fmtDate(photosChrono[startIdx].date) : "-";
  const endLabel = photosChrono[endIdx]?.date ? fmtDate(photosChrono[endIdx].date) : "-";
  const frameCount = urls.length ? endIdx - startIdx + 1 : 0;

  return (
    <Container>
      <Topbar title="Timelapse" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {urls.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.8 }}>Noch keine Fotos.</p>
        ) : (
          <>
            {/* Preview */}
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

            {/* Range Info */}
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div><b>Von:</b> {startLabel}</div>
              <div><b>Bis:</b> {endLabel}</div>
              <div><b>Frames:</b> {frameCount}</div>
            </div>

            {/* Range Sliders */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Timelapse-Bereich auswählen</div>

              <label style={{ display: "block" }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  Start ({startIdx + 1})
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, urls.length - 1)}
                  step={1}
                  value={startIdx}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setStartIdx(v);
                    if (v > endIdx) setEndIdx(v); // Start darf End nicht überholen
                  }}
                  style={{ width: "100%" }}
                />
              </label>

              <label style={{ display: "block", marginTop: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  Ende ({endIdx + 1})
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, urls.length - 1)}
                  step={1}
                  value={endIdx}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setEndIdx(v);
                    if (v < startIdx) setStartIdx(v); // End darf Start nicht unterbieten
                  }}
                  style={{ width: "100%" }}
                />
              </label>

              {/* Quick presets */}
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    const len = urls.length;
                    const s = Math.max(0, len - 7);
                    const e = len - 1;
                    setStartIdx(s);
                    setEndIdx(e);
                    setIndex(s);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Letzte 7
                </button>

                <button
                  onClick={() => {
                    const len = urls.length;
                    const s = Math.max(0, len - 10);
                    const e = len - 1;
                    setStartIdx(s);
                    setEndIdx(e);
                    setIndex(s);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Letzte 10
                </button>

                <button
                  onClick={() => {
                    setStartIdx(0);
                    setEndIdx(urls.length - 1);
                    setIndex(0);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Alle
                </button>
              </div>
            </div>

            {/* Frame scrub (innerhalb Range) */}
            <label style={{ display: "block", marginTop: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                Frame auswählen (im Bereich)
              </div>
              <input
                type="range"
                min={startIdx}
                max={endIdx}
                step={1}
                value={index}
                onChange={(e) => {
                  setPlaying(false);
                  setIndex(Number(e.target.value));
                }}
                style={{ width: "100%" }}
              />
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                Frame: {index + 1} / {urls.length}
              </div>
            </label>

            {/* Controls */}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setPlaying(false);
                  setIndex(startIdx);
                }}
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
                  // Wenn am Ende: wieder auf Start
                  if (!playing && index >= endIdx) setIndex(startIdx);
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

            {/* Speed */}
            <label style={{ display: "block", marginTop: 14 }}>
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
