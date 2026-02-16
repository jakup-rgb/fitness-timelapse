"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const items: Item[] = [
  { href: "/", label: "Progress", icon: "📸" },
  { href: "/feed", label: "Feed", icon: "📝" },
  { href: "/recipes", label: "Recipes", icon: "🍽️" },
  { href: "/profile", label: "Profil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl">
        <div className="grid grid-cols-4">
          {items.map((it) => {
            const active =
              pathname === it.href ||
              (it.href !== "/" && pathname?.startsWith(it.href));

            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs",
                  active ? "text-white" : "text-white/60",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                    active ? "bg-white/15" : "bg-transparent",
                  ].join(" ")}
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
