import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medlemsregistret CRM",
  description: "CRM-system för svenska föreningar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
