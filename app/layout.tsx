import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whentor AI — Your Mentor. Anytime. Anywhere.",
  description: "14 AI mentor worlds available 24/7. Talk to mindset coaches, startup builders, wealth architects, and more. No signup required to start.",
  openGraph: {
    title: "Whentor AI",
    description: "14 AI mentor worlds. Always available. Start free.",
    siteName: "Whentor AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Whentor AI — Your Mentor. Anytime. Anywhere.",
    description: "14 AI mentor worlds available 24/7. No signup required.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" style={{ background: '#0B0B0B', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
