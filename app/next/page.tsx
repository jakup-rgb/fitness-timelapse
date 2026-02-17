"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Topbar, ButtonLink, Card } from "../ui";

export default function NextPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Swipe Back (rechts wischen => Home) ---
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const sx = startX.current;
    const sy = startY.current;
    startX.current = null;
    startY.current = null;

    if (sx == null || sy == null) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const MIN_X = 80;
    const MAX_Y = 60;

    if (dx > MIN_X && absY < MAX_Y && absX > absY) {
      router.push("/"); // zurück zum Home
    }
  }

  // Menü schließen beim Klick außerhalb + ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-menu-root]")) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Kleine Button-Komponente (ohne extra Libraries)
  function ActionButton({
    href,
    icon,
    title,
    subtitle,
  }: {
    href: string;
    icon: string;
    title: string;
    subtitle: string;
  }) {
    const [pressed, setPressed] = useState(false);

    return (
      <a
        href={href}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        style={{
          textDecoration: "none",
          color: "var(--foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "16px 16px",
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          transform: pressed ? "scale(0.99)" : "scale(1)",
          opacity: pressed ? 0.9 : 1,
          transition: "transform 120ms ease, opacity 120ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--icon-tile-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>
              {title}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                opacity: 0.7,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        <div style={{ opacity: 0.8, fontSize: 18, flexShrink: 0 }}>›</div>
      </a>
    );
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
            <div style={{ position: "relative" }} data-menu-root>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  color: "var(--foreground)",
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
                    border: "1px solid var(--border)",
                    background: "var(--card)",
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
                  <ButtonLink href="/">Home</ButtonLink>
                </div>
              )}
            </div>
          }
        />

        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, opacity: 0.9 }}>
            Menü
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <ActionButton
              href="/timelapse"
              icon="🎞"
              title="Timelapse"
              subtitle="Dein Fortschritt als Animation"
            />
            <ActionButton
              href="/camera"
              icon="📸"
              title="Bild machen"
              subtitle="Neues Foto aufnehmen"
            />
            <ActionButton
              href="/calendar"
              icon="📆"
              title="Kalender"
              subtitle="Tage & Fotos im Überblick"
            />
            <ActionButton
              href="/notes"
              icon="📝"
              title="Notiz"
              subtitle="Training, Gewicht, Gedanken"
            />
          </div>
        </Card>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, opacity: 0.55 }}>
          Tipp: Nach rechts wischen = zurück
        </div>
      </Container>
    </div>
  );
}
