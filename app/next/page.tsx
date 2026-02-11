"use client";

import { useEffect, useState } from "react";
import { Container, Topbar, ButtonLink, Card } from "../ui";

export default function NextPage() {
  const [menuOpen, setMenuOpen] = useState(false);

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

  const itemStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
  };

  const leftStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: 22,
    width: 28,
    textAlign: "center",
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const subStyle: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const arrowStyle: React.CSSProperties = {
    opacity: 0.75,
    fontSize: 18,
    flexShrink: 0,
  };

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
          <div style={{ position: "relative" }} data-menu-root>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
                color: "white",
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
                <ButtonLink href="/">Home</ButtonLink>
              </div>
            )}
          </div>
        }
      />

      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <a href="/timelapse" style={itemStyle}>
            <div style={leftStyle}>
              <div style={iconStyle}>🎞</div>
              <div style={{ minWidth: 0 }}>
                <div style={titleStyle}>Timelapse</div>
                <div style={subStyle}>Alle Fotos als Video anschauen</div>
              </div>
            </div>
            <div style={arrowStyle}>›</div>
          </a>

          <a href="/camera" style={itemStyle}>
            <div style={leftStyle}>
              <div style={iconStyle}>📸</div>
              <div style={{ minWidth: 0 }}>
                <div style={titleStyle}>Bild machen</div>
                <div style={subStyle}>Neues Fortschrittsfoto aufnehmen</div>
              </div>
            </div>
            <div style={arrowStyle}>›</div>
          </a>

          {/* Platzhalter-Links: kannst du später bauen */}
          <a href="/calendar" style={itemStyle}>
            <div style={leftStyle}>
              <div style={iconStyle}>📆</div>
              <div style={{ minWidth: 0 }}>
                <div style={titleStyle}>Kalender</div>
                <div style={subStyle}>Übersicht deiner Tage & Fotos</div>
              </div>
            </div>
            <div style={arrowStyle}>›</div>
          </a>

          <a href="/notes" style={itemStyle}>
            <div style={leftStyle}>
              <div style={iconStyle}>📝</div>
              <div style={{ minWidth: 0 }}>
                <div style={titleStyle}>Notiz</div>
                <div style={subStyle}>Training, Gewicht, Gedanken speichern</div>
              </div>
            </div>
            <div style={arrowStyle}>›</div>
          </a>
        </div>
      </Card>
    </Container>
  );
}
