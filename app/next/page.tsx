"use client";

import { Container, Topbar, ButtonLink, Card } from "../ui";

export default function NextPage() {
  return (
    <Container>
      <Topbar title="" right={<ButtonLink href="/">Zurück</ButtonLink>} />

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <Card>
          <ButtonLink href="/timelapse">🎞 Timelapse</ButtonLink>
        </Card>

        <Card>
          <ButtonLink href="/camera">📸 Bild machen</ButtonLink>
        </Card>

        <Card>
          <ButtonLink href="/calendar">📆 Kalender</ButtonLink>
        </Card>

        <Card>
          <ButtonLink href="/notes">📝 Notiz</ButtonLink>
        </Card>
      </div>
    </Container>
  );
}
