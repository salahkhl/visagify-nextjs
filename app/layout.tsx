import type { Metadata } from "next";

import "./css/style.css";
import "./globals.css";

import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Visagify - AI Face Swapping",
  description: "Transform any photo with our advanced face swapping technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-black tracking-tight text-white antialiased font-sans">
        <CartProvider>
          <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
