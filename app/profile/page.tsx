import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5 text-white backdrop-blur-xl">
      <div className="text-lg font-semibold">Profil</div>
      <div className="mt-2 text-white/70">Settings & Theme</div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/settings"
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Einstellungen öffnen
        </Link>
      </div>
    </div>
  );
}
