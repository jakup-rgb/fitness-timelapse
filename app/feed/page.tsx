export default function FeedPage() {
  return (
    <div
      className="rounded-3xl border p-5 backdrop-blur-xl"
      style={{
        borderColor: "var(--border)",
        background: "var(--nav-bg)",
        color: "var(--foreground)",
      }}
    >
      <div className="text-lg font-semibold">Feed / Notizen</div>
      <div className="mt-2" style={{ color: "var(--muted)" }}>
        Kommt gleich als Nächstes 🙂
      </div>
    </div>
  );
}
