import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "AllergySafe Table: Can Prithvi eat this?",
  description:
    "Ask whether a dish suits Prithvi's lactose intolerance, sensitive gut, thyroid, and weight-loss goals. Check ingredients, photos, and recipes, and plan healthy shared meals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1412" },
  ],
};

// Applies the saved (or system) theme before first paint to avoid a light flash.
const themeScript = `try{var s=localStorage.getItem("allergysafe.dark");var d=s!==null?JSON.parse(s):window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plexSans.variable} ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
