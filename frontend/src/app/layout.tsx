import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEBODY — The Living Operating System for the Internet",
  description:
    "The web changes every second. WEBODY remembers, understands, predicts, and acts. Autonomous web intelligence ecosystem powered by Anakin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen font-sans antialiased selection:bg-hud-cyan/30 selection:text-hud-cyan">
        {children}
      </body>
    </html>
  );
}
