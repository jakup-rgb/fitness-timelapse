"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Topbar, ButtonLink, Card } from "../ui";
import { getNote, upsertNote, deleteNote } from "../lib/db";

function localDayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function NotesPage() {
  const router = useRouter();

  const todayKey = useMemo(() => localDayKey(new Date()), []);
  const [day, setDay] = useState(todayKey);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load(d: string) {
    setLoading(true);
    const n = await getNote(d);
    setText(n?.text ?? "");
    setLoading(false);
  }

  useEffect(() => {
    load(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  async function handleSave() {
    const t = text.trim();
    if (!t) return;

    setSaving(true);
    try {
      await upsertNote(day, t);
      router.push("/next"); // ✅ zurück ins Menü nach dem Speichern
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = confirm("Notiz wirklich löschen?");
    if (!ok) return;
    await deleteNote(day);
    setText("");
  }

  return (
    <Container>
      <Topbar title="Notiz" right={<ButtonLink href="/next">Zurück</ButtonLink>} />

      <Card>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Datum</div>
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          />
          {day === todayKey && <div style={{ fontSize: 12, opacity: 0.7 }}>Heute</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Deine Notiz</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={loading ? "Lade..." : "z.B. Training, Gewicht, Gefühl..."}
            rows={6}
            style={{
              width: "100%",
              resize: "vertical",
              padding: "12px",
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
              outline: "none",
              lineHeight: 1.4,
            }}
          />
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving || loading || text.trim().length === 0}
            style={{
              padding: "12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "white",
              color: "black",
              fontWeight: 800,
              cursor: saving || loading || text.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: saving || loading || text.trim().length === 0 ? 0.7 : 1,
            }}
          >
            {saving ? "Speichere..." : "Speichern"}
          </button>

          <button
            onClick={handleDelete}
            disabled={loading || text.trim().length === 0}
            style={{
              padding: "12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
              fontWeight: 700,
              cursor: loading || text.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: loading || text.trim().length === 0 ? 0.6 : 1,
            }}
          >
            Löschen
          </button>
        </div>
      </Card>
    </Container>
  );
}
