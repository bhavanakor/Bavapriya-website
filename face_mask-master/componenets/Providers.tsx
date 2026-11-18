"use client";

import { CartProvider } from "@/componenets/CartProvider";
import { ThemeProvider } from "@/componenets/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>{children}</CartProvider>
    </ThemeProvider>
  );
}
