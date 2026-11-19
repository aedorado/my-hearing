import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Hearing — Personal Sadhana & Katha Catalogue",
  description: "Distraction-free personal hearing archive for daily katha, sadhana tracking, and spiritual absorption.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col pb-28">
        {children}
      </body>
    </html>
  );
}
