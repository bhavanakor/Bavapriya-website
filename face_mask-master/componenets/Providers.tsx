"use client";

import { CartProvider } from "@/componenets/CartProvider";
import { ThemeProvider } from "@/componenets/ThemeProvider";
import ThemeToggle from "@/componenets/ThemeToggle";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        {children}
        <ThemeToggle />
      </CartProvider>
    </ThemeProvider>
  );
}
