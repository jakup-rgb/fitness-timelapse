"use client";

import { useState } from "react";
import { Container, Topbar, ButtonLink, Card } from "../ui";

export default function NextPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Container>
      {/* Topbar wie Home */}
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
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
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
              </div>
            )}
          </div>
        }
      />

      {/* Menü-Bereich */}
      <div
        style={{
          marginTop: 20,
          display: "grid",
          gap: 14,
        }}
      >
        {/* Timelapse */}
        <Card>
          <a
            href="/timelapse"
            style={{
              display: "block",
              padding: "18px",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 600,
              textAlign: "center",
              color: "white",
            }}
          >
            🎞 Timelapse
          </a>
        </Card>

        {/* Bild machen */}
        <Card>
          <a
            href="/camera"
            style={{
              display: "block",
              padding: "18px",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 600,
              textAlign: "center",
              color: "white",
            }}
          >
            📸 Bild machen
          </a>
        </Card>

        {/* Kalender */}
        <Card>
          <a
            href="/calendar"
            style={{
              display: "block",
              padding: "18px",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 600,
              textAlign: "center",
              color: "white",
            }}
          >
            📆 Kalender
          </a>
        </Card>

        {/* Notiz */}
        <Card>
          <a
            href="/notes"
            style={{
              display: "block",
              padding: "18px",
              textDecoration: "none",
              fontSize: 18,
              fontWeight: 600,
              textAlign: "center",
              color: "white",
            }}
          >
            📝 Notiz
          </a>
        </Card>
      </div>
    </Container>
  );
}
