import type { Metadata, Viewport } from "next";
import { Heebo, Press_Start_2P, VT323 } from "next/font/google";
import "@/index.css";
import { Providers } from "./providers";

const heebo = Heebo({
  subsets: ["hebrew"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-press-start-2p",
  weight: ["400"],
});

const vt323 = VT323({
  subsets: ["latin"],
  variable: "--font-vt323",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "SoulQuest ⚔️",
  description: "SoulQuest - משחק RPG לחוסן נפשי לבני נוער",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SoulQuest",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A2E1B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${pressStart2P.variable} ${vt323.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
