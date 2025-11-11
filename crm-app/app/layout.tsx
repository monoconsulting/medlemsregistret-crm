import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Medlemsregistret CRM",
  description: "CRM-system för svenska föreningar",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <head>
        {/* Force HTTPS for all requests - fixes Mixed Content errors */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body
        className={cn(
          "bg-[#f6f8fc] text-slate-900 antialiased",
          inter.variable,
          "font-sans"
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
