import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rabbit Hole Agent",
  description: "AI-powered curiosity-driven research explorer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
