"use client";

import { useEffect, useState } from "react";
import { Container, Topbar, ButtonLink, Card } from "../ui";

const KEY = "reminder_time"; // "HH:MM"

export default function SettingsPage() {
  const [time, setTime] = useState("20:00");

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setTime(saved);
  }, []);

  function save() {
    localStorage.setItem(KEY, time);
    alert("Gespeichert ✅");
  }

  return (
    <Container>
      <Topbar title="Settings" right={<ButtonLink href="/">Zurück</ButtonLink>} />

      <Card>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
          Reminder-Uhrzeit
        </div>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "transparent",
          }}
        />
<button
  onClick={async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      alert("Benachrichtigungen aktiviert ✅");
    } else {
      alert("Benachrichtigungen nicht erlaubt ❌");
    }
  }}
  style={{
    marginTop: 12,
    padding: "12px",
    width: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontWeight: 600,
  }}
>
  Benachrichtigungen aktivieren
</button>


        <button
          onClick={save}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Speichern
        </button>
      </Card>
    </Container>
  );
}
