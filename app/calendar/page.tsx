"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export default function CalendarPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const all = await getAllPhotos();
      setPhotos(all);
    })();
  }, []);

  // Map: dayKey -> latest photo of that day
  const photoByDay = useMemo(() => {
    const map = new Map<string, PhotoEntry>();
    // all ist bei dir: neueste -> älteste
    for (const p of photos) {
      const k = dayKey(new Date(p.date));
      // wir nehmen das erste (neueste) pro Tag
      if (!map.has(k)) map.set(k, p);
    }
    return map;
  }, [photos]);

  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonth(today), [today]);
  const totalDays = useMemo(() => daysInMonth(today), [today]);

  // weekday offset: 0=So ... 6=Sa
  const offset = useMemo(() => monthStart.getDay(), [monthStart]);

  const monthLabel = useMemo(() => {
    return monthStart.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  }, [monthStart]);

  const selectedPhoto = useMemo(() => {
    if (!selectedDay) return null;
    return photoByDay.get(selectedDay) ?? null;
  }, [selectedDay, photoByDay]);

  // URL fürs Modal-Image
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedPhoto) {
      setModalUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedPhoto.blob);
    setModalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPhoto]);

  const weekday = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  return (
    <Container>
      <Topbar title="Kalender" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{monthLabel}</div>

        {/* Wochentage */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            marginBottom: 8,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          {weekday.map((w) => (
            <div key={w} style={{ textAlign: "center" }}>
              {w}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {/* Leere Felder vor dem 1. */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Tage */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), dayNum);
            const key = dayKey(date);

            const hasPhoto = photoByDay.has(key);
            const isToday = key === dayKey(new Date());

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                style={{
                  height: 44,
                  borderRadius: 12,
                  border: isToday
                    ? "2px solid rgba(255,255,255,0.55)"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: hasPhoto ? "rgba(0, 200, 120, 0.22)" : "rgba(255,255,255,0.06)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={`Tag ${dayNum}${hasPhoto ? " hat Foto" : " kein Foto"}`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
          Grün = Foto vorhanden • Klick auf einen Tag zeigt das Foto
        </div>
      </Card>

      {/* Modal */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            zIndex: 999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(20,20,20,0.95)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>
                {new Date(selectedDay).toLocaleDateString("de-DE")}
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  borderRadius: 12,
                  padding: "8px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Schließen
              </button>
            </div>

            {!selectedPhoto ? (
              <div style={{ padding: 14, opacity: 0.8 }}>
                Kein Foto an diesem Tag.
              </div>
            ) : (
              <div style={{ width: "100%", background: "#000" }}>
                {modalUrl && (
                  <img
                    src={modalUrl}
                    alt="Foto vom Tag"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  );
}
