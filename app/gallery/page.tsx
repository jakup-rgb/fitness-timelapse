"use client";

import { useEffect, useState } from "react";
import { deletePhoto, getAllPhotos, type PhotoEntry } from "../lib/db";
import { Container, Topbar, ButtonLink, Card } from "../ui";

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

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  };

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
        <Card>
          <div style={grid}>
            {photos.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpenId(p.id)}
                style={{
                  border: "none",
                  padding: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
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
      )}

      {/* Lightbox */}
      {openId && (
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
            <div style={{ padding: 12, fontSize: 12, opacity: 0.8, color: "white" }}>
              {(() => {
                const p = photos.find((x) => x.id === openId);
                if (!p) return null;
                return (
                  <>
                    {new Date(p.date).toLocaleDateString()}{" "}
                    {new Date(p.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                );
              })()}
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
    </Container>
  );
}
