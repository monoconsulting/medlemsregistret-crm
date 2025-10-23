import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/lib/providers/app-providers";
import { Toaster } from "@/components/ui/toaster";

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
      <body className="font-sans antialiased">
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
