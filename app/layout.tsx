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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className="bg-black font-sans tracking-tight text-white antialiased"
      >
        <CartProvider>
          <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
            {children}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
