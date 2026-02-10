import Link from "next/link";
import { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>{children}</main>;
}

export function Topbar({
    title,
    right,
  }: {
    title: React.ReactNode;
    right?: React.ReactNode;
  }) {
  
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <h1 style={{ margin: 0 }}>{title}</h1>
      {right}
    </div>
  );
}

export function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.15)",
        textDecoration: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </Link>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      {children}
    </div>
  );
}
