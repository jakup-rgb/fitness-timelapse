"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const items: Item[] = [
  { href: "/", label: "Progress", icon: "📸" },
  { href: "/gallery", label: "Galerie", icon: "🖼️" },
  { href: "/next", label: "Menu", icon: "☰" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div
  className="mx-auto max-w-md rounded-3xl backdrop-blur-xl shadow-2xl"
  style={{
    border: "1px solid var(--border)",
    background: "var(--nav-bg)",
  }}
>
  <div className="grid grid-cols-3">
    {items.map((it) => {
      const active = pathname === it.href;

      return (
        <Link
          key={it.href}
          href={it.href}
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs"
          style={{
            color: active ? "var(--foreground)" : "var(--muted)",
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{
              background: active
  ? (getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim() === "#ededed"
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.08)")
  : "transparent",
            }}
          >
            <span className="text-lg">{it.icon}</span>
          </div>
          <span className={active ? "font-semibold" : "font-medium"}>
            {it.label}
          </span>
        </Link>
      );
    })}
  </div>
</div>
    </div>
  );
}
