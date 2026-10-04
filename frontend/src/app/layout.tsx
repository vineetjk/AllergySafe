import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllergySafe Table — Built for Maya",
  description: "Open-source AI dining companion that audits recipes, remixes unsafe dishes, and plans shared meals for roommates with complex allergies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-100/60 text-stone-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
