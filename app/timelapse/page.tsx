"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // YYYY-MM-DD (lokal)
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}

type RangeMode = "date" | "photo";
type QuickPreset = "7" | "10" | "30" | "all" | null;

export default function TimelapsePage() {
  const [photosRaw, setPhotosRaw] = useState<PhotoEntry[]>([]);
  const photosChrono = useMemo(() => {
    // getAllPhotos liefert: neueste -> älteste
    // für Timelapse: älteste -> neueste
    const copy = [...photosRaw];
    copy.sort((a, b) => a.date.localeCompare(b.date));
    return copy;
  }, [photosRaw]);

  // Auswahl (Range)
  const [mode, setMode] = useState<RangeMode>("date");
  const [modalOpen, setModalOpen] = useState(false);

  // Datum-Range (inklusive)
  const [fromDay, setFromDay] = useState<string>("");
  const [toDay, setToDay] = useState<string>("");

  // Foto-Range (über Index)
  const [startId, setStartId] = useState<string>("");
  const [endId, setEndId] = useState<string>("");

  // Quick Preset (für Highlight)
  const [quickPreset, setQuickPreset] = useState<QuickPreset>(null);

  // Aktiver gefilterter Bereich
  const filteredPhotos = useMemo(() => {
    if (photosChrono.length === 0) return [];

    const safeFrom = fromDay || localDayKey(new Date(photosChrono[0].date));
    const safeTo =
      toDay || localDayKey(new Date(photosChrono[photosChrono.length - 1].date));

    if (mode === "date") {
      // falls user von/bis vertauscht → sauber machen
      const a = safeFrom <= safeTo ? safeFrom : safeTo;
      const b = safeFrom <= safeTo ? safeTo : safeFrom;

      return photosChrono.filter((p) => {
        const k = localDayKey(new Date(p.date));
        return k >= a && k <= b;
      });
    }

    // mode === "photo"
    const sIdx = Math.max(
      0,
      photosChrono.findIndex((p) => p.id === (startId || photosChrono[0].id))
    );
    const eIdx = Math.max(
      0,
      photosChrono.findIndex(
        (p) => p.id === (endId || photosChrono[photosChrono.length - 1].id)
      )
    );

    const a = Math.min(sIdx, eIdx);
    const b = Math.max(sIdx, eIdx);

    return photosChrono.slice(a, b + 1);
  }, [photosChrono, mode, fromDay, toDay, startId, endId]);

  // URLs für gefilterte Photos
  const [urls, setUrls] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300);

  // Fotos laden
  useEffect(() => {
    (async () => {
      const all = await getAllPhotos();
      setPhotosRaw(all);
    })();
  }, []);

  // Defaults setzen, sobald Photos da sind
  useEffect(() => {
    if (photosChrono.length === 0) return;

    const first = photosChrono[0];
    const last = photosChrono[photosChrono.length - 1];

    setFromDay((v) => v || localDayKey(new Date(first.date)));
    setToDay((v) => v || localDayKey(new Date(last.date)));

    setStartId((v) => v || first.id);
    setEndId((v) => v || last.id);
  }, [photosChrono]);

  // Wenn User manuell Datum/Fotos ändert → QuickPreset zurücksetzen
  useEffect(() => {
    setQuickPreset(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDay, toDay, startId, endId, mode]);

  // Blob → URLs (für gefilterte Photos)
  useEffect(() => {
    const next = filteredPhotos.map((p) => URL.createObjectURL(p.blob));
    setUrls(next);
    setIndex(0);
    setPlaying(true);

    return () => {
      next.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [filteredPhotos]);

  function prevFrame() {
    if (urls.length === 0) return;
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  }

  function nextFrame() {
    if (urls.length === 0) return;
    setIndex((i) => (i + 1) % urls.length);
  }

  // Slideshow
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

  const activeRangeLabel = useMemo(() => {
    if (filteredPhotos.length === 0) return "—";

    const a = filteredPhotos[0];
    const b = filteredPhotos[filteredPhotos.length - 1];

    const aKey = localDayKey(new Date(a.date));
    const bKey = localDayKey(new Date(b.date));

    return `${aKey} → ${bKey} (${filteredPhotos.length} Fotos)`;
  }, [filteredPhotos]);

  function applyQuickLastDays(days: number) {
    if (photosChrono.length === 0) return;
    const last = photosChrono[photosChrono.length - 1];
    const end = new Date(last.date);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    setMode("date");
    setFromDay(localDayKey(start));
    setToDay(localDayKey(end));
    setQuickPreset(String(days) as QuickPreset);
  }

  function applyAll() {
    if (photosChrono.length === 0) return;
    const first = photosChrono[0];
    const last = photosChrono[photosChrono.length - 1];

    setMode("date");
    setFromDay(localDayKey(new Date(first.date)));
    setToDay(localDayKey(new Date(last.date)));

    setStartId(first.id);
    setEndId(last.id);
    setQuickPreset("all");
  }

  function safeCloseModal() {
    setModalOpen(false);
  }

  const uploadStyleButton: React.CSSProperties = {
    padding: "16px 36px",
    borderRadius: 999,
    background: "white",
    color: "black",
    fontWeight: 800,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
  };

  // Pressable Quick Button (Pointer Events → Mobile/Touch friendly)
  function QuickButton({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) {
    const baseBg = active ? "white" : "var(--surface-2)";
    const baseColor = active ? "black" : "var(--foreground)";
    const baseBorder = active
      ? "1px solid var(--border)"
      : "1px solid var(--border)";

    return (
      <button
        onClick={onClick}
        onPointerDown={(e) => {
          e.currentTarget.style.transform = "scale(0.95)";
          e.currentTarget.style.filter = "brightness(1.05)";
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.filter = "none";
        }}
        onPointerCancel={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.filter = "none";
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.filter = "none";
        }}
        style={{
          padding: "11px 14px",
          borderRadius: 999,
          border: baseBorder,
          background: baseBg,
          color: baseColor,
          fontWeight: 900,
          cursor: "pointer",
          transition: "transform 0.12s ease, background 0.12s ease, color 0.12s ease, border 0.12s ease",
          boxShadow: active ? "0 10px 26px rgba(0,0,0,0.35)" : "0 6px 18px rgba(0,0,0,0.22)",
          touchAction: "manipulation",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <Container>
      <Topbar title="Timelapse" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        {urls.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.8 }}>Noch keine Fotos im ausgewählten Bereich.</p>
        ) : (
          <>
            {/* Header / Bereich */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Bereich: <span style={{ fontWeight: 700 }}>{activeRangeLabel}</span>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--foreground)",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                von - bis
              </button>
            </div>

            {/* Bild */}
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

            {/* Frame Slider */}
            <label style={{ display: "block", marginTop: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Frame auswählen</div>
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

            {/* Controls */}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={prevFrame}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
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
                  border: "1px solid var(--border)",
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
                  border: "1px solid var(--border)",
                  background: "transparent",
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

            {/* ✅ Unten: Upload-Style Button */}
            <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setModalOpen(true)} style={uploadStyleButton}>
                von - bis
              </button>
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) safeCloseModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--card-strong)",
              padding: 14,
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16 }}>Timelapse-Bereich</div>
              <button
                onClick={safeCloseModal}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setMode("date")}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: mode === "date" ? "white" : "var(--surface-2)",
                  color: mode === "date"  ? "black" : "var(--foreground)",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Nach Datum
              </button>
              <button
                onClick={() => setMode("photo")}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: mode === "photo" ? "white" : "var(--surface-2)",
                  color: mode === "photo"  ? "black" : "var(--foreground)",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Nach Foto
              </button>
            </div>

            {/* Quick (mit Press-Effekt + Active Highlight) */}
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <QuickButton
                label="Letzte 7"
                active={quickPreset === "7"}
                onClick={() => applyQuickLastDays(7)}
              />
              <QuickButton
                label="Letzte 10"
                active={quickPreset === "10"}
                onClick={() => applyQuickLastDays(10)}
              />
              <QuickButton
                label="Letzte 30"
                active={quickPreset === "30"}
                onClick={() => applyQuickLastDays(30)}
              />
              <QuickButton label="Alle" active={quickPreset === "all"} onClick={applyAll} />
            </div>

            {/* Content */}
            {mode === "date" ? (
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Von</div>
                  <input
                    type="date"
                    value={fromDay}
                    onChange={(e) => setFromDay(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Bis</div>
                  <input
                    type="date"
                    value={toDay}
                    onChange={(e) => setToDay(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1", fontSize: 12, opacity: 0.65 }}>
                  Tipp: Wenn „Von“ größer als „Bis“ ist, ist es egal – wir filtern trotzdem korrekt.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Start-Foto</div>
                  <select
                    value={startId}
                    onChange={(e) => setStartId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--foreground)",
                    }}
                  >
                    {photosChrono.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDateLabel(p.date)} ({localDayKey(new Date(p.date))})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Ende-Foto</div>
                  <select
                    value={endId}
                    onChange={(e) => setEndId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--foreground)",
                    }}
                  >
                    {photosChrono.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDateLabel(p.date)} ({localDayKey(new Date(p.date))})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1", fontSize: 12, opacity: 0.65 }}>
                  Du kannst auch „Ende“ vor „Start“ auswählen – wir drehen es automatisch richtig.
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={safeCloseModal}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--foreground)",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Schließen
              </button>
              <button
                onClick={() => {
                  setIndex(0);
                  setPlaying(true);
                  safeCloseModal();
                }}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "white",
                  color: "black",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Anwenden
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
