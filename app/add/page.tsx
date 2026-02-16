"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addPhoto } from "../lib/db";
import { Card, Container, Topbar, ButtonLink } from "../ui";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateTimeInputs(d: Date) {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function localInputsToISO(dateStr: string, timeStr: string) {
  // interpretiert als lokale Zeit, wandelt dann sauber nach ISO (UTC)
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return dt.toISOString();
}

export default function AddPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("Noch keine Datei ausgewählt");
  const [saving, setSaving] = useState(false);

  const [dateStr, setDateStr] = useState(""); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(""); // HH:MM

  const canSave = useMemo(() => {
    return !!file && !!dateStr && !!timeStr && !saving;
  }, [file, dateStr, timeStr, saving]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setFilename(f.name);

    // Default: Datei-Zeitstempel (meist ok als “Aufnahmezeit” Fallback)
    const d = new Date(f.lastModified);
    const { date, time } = toLocalDateTimeInputs(d);
    setDateStr(date);
    setTimeStr(time);
  }

  async function handleSave() {
    if (!file) return;

    setSaving(true);
    try {
      const dateISO = localInputsToISO(dateStr, timeStr);
      await addPhoto(file, dateISO);
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <Topbar title="Foto hinzufügen" right={<ButtonLink href="/">Zurück</ButtonLink>} />

      <Card>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <button
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "transparent",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Datei auswählen
        </button>

        <p style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>{filename}</p>

        {/* Datum/Uhrzeit Auswahl */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Aufnahmedatum</div>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Uhrzeit</div>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                background: "transparent",
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: canSave ? "white" : "rgba(255,255,255,0.3)",
            color: "black",
            cursor: canSave ? "pointer" : "not-allowed",
            fontSize: 16,
            fontWeight: 800,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Speichere..." : "Upload"}
        </button>
      </Card>
    </Container>
  );
}
