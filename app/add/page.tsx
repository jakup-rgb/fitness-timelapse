"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addPhoto } from "../lib/db";
import { Card, Container, Topbar, ButtonLink } from "../ui";

export default function AddPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState("Noch keine Datei ausgewählt");
  const [saving, setSaving] = useState(false);


  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setSaving(true);
    setFilename(file.name);
  
    try {
      await addPhoto(file);
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
          disabled={saving}
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
          {saving ? "Speichere..." : "Datei auswählen"}
        </button>

        <p style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>{filename}</p>
      </Card>
    </Container>
  );
}
