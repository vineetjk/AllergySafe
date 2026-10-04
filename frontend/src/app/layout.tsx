import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllergySafe Table: Can Prithvi eat this?",
  description: "Ask whether a dish suits Prithvi's lactose intolerance, sensitive gut, thyroid, and weight-loss goals. Check ingredients, photos, and recipes, and plan healthy shared meals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-100/60 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
