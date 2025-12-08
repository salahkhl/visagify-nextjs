import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy Credits - Visagify",
  description: "Purchase credits for AI face swapping",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {children}
    </div>
  );
}

