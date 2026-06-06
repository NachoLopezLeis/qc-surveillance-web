import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";
import AmbientField from "@/components/AmbientField";
import ConstellationFigure from "@/components/viz/ConstellationFigure";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Effective Rank — Market manipulation surveillance & anomaly detection",
  description:
    "Anomaly detection for market manipulation — spoofing, wash trading and collusion live in the order flow and the relational structure between traders, not in the price. A falsifiable effective-rank criterion and an end-to-end measurement pipeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} ${schibsted.variable}`}
    >
      <body className="relative">
        <AmbientField />
        <ConstellationFigure />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
