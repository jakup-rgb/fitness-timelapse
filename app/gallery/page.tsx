"use client";

import { useEffect, useMemo, useState } from "react";
import { deletePhoto, getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

// Lokal (DE) Tag-Key: YYYY-MM-DD in lokaler Zeit (kein UTC-Bug)
function localDayKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(dayKey: string) {
  // dayKey = YYYY-MM-DD
  const [y, m, d] = dayKey.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() {
    const all = await getAllPhotos(); // bei dir: neueste -> älteste
    setPhotos(all);
  }

  useEffect(() => {
    refresh();
  }, []);

  // Blob -> URLs + cleanup
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const p of photos) next[p.id] = URL.createObjectURL(p.blob);
    setUrls(next);

    return () => {
      Object.values(next).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  async function handleDelete(id: string) {
    const ok = confirm("Foto wirklich löschen?");
    if (!ok) return;
    await deletePhoto(id);
    setOpenId(null);
    await refresh();
  }

  const openPhoto = useMemo(
    () => (openId ? photos.find((p) => p.id === openId) ?? null : null),
    [openId, photos]
  );

  // ✅ Gruppierung nach Tag
  const grouped = useMemo(() => {
    const map = new Map<string, PhotoEntry[]>();
    for (const p of photos) {
      const key = localDayKey(p.date);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }

    // Photos sind bei dir schon neueste->älteste, wir lassen die Reihenfolge so.
    // Day-Keys sortieren: neueste Tage oben
    const keys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return keys.map((k) => ({
      dayKey: k,
      items: map.get(k) ?? [],
    }));
  }, [photos]);

  return (
    <Container>
      <Topbar title="Galerie" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      {photos.length === 0 ? (
        <Card>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Noch keine Fotos. Mach ein Foto oder lade eins hoch 🙂
          </p>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {grouped.map((group) => (
            <Card key={group.dayKey}>
              {/* Datum-Header */}
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                {formatDayLabel(group.dayKey)}
              </div>

              {/* Grid wie Galerie */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {group.items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setOpenId(p.id)}
                    style={{
                      border: "none",
                      padding: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    aria-label="Foto öffnen"
                  >
                    <img
                      src={urls[p.id]}
                      alt="thumb"
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        objectFit: "cover",
                        borderRadius: 12,
                        display: "block",
                      }}
                    />
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {openId && openPhoto && (
        <div
          onClick={() => setOpenId(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              borderRadius: 18,
              overflow: "hidden",
              background: "rgba(20,20,20,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ padding: 12, fontSize: 12, opacity: 0.9, color: "white" }}>
              {new Date(openPhoto.date).toLocaleDateString("de-DE")}{" "}
              {new Date(openPhoto.date).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div
              style={{
                width: "100%",
                height: "60vh",
                minHeight: 360,
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={urls[openId]}
                alt="full"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            <div style={{ padding: 12, display: "flex", gap: 10 }}>
              <button
                onClick={() => setOpenId(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Schließen
              </button>

              <button
                onClick={() => handleDelete(openId)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Upload Button */}
<div
  style={{
    position: "fixed",
    bottom: 24,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 50,
  }}
>
  <a
    href="/add"
    style={{
      pointerEvents: "auto",
      padding: "16px 28px",
      borderRadius: 999,
      background: "white",
      color: "black",
      fontWeight: 800,
      fontSize: 15,
      textDecoration: "none",
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      transition: "all 0.2s ease",
    }}
  >
    ＋ Upload
  </a>
</div>
{/* Floating Upload Button */}
<a
  href="/add"
  style={{
    position: "fixed",
    bottom: 90, // 👈 über der BottomNav!
    left: "50%",
    transform: "translateX(-50%)",
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "white",
    color: "black",
    fontSize: 28,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 15px 40px rgba(0,0,0,0.45)",
    zIndex: 1000,
  }}
>
  uplaod
</a>

    </Container>
    
  );
}
