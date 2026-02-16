"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "./theme/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
