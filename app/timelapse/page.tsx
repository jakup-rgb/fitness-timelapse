"use client";

import { useEffect, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

export default function TimelapsePage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300); // ms pro Bild



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
  

  // Slideshow
  useEffect(() => {
    if (urls.length === 0 || !playing) return;
  
    const timer = setInterval(() => {
      setIndex((i) => {
        // wenn letztes Bild erreicht → stoppen
        if (i >= urls.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, speed);
  
    return () => clearInterval(timer);
  }, [urls, playing, speed]);
  


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
            </p>
            <label style={{ display: "block", marginTop: 10 }}>
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
      setPlaying(false); // beim scrubben pausieren
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
  if (!playing && index >= urls.length - 1) {
    setIndex(0); // von vorne
  }
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
  <div style={{ fontSize: 12, opacity: 0.6 }}>
    {speed} ms
  </div>
</label>


          </>
        )}
      </Card>
    </Container>
  );
}
