import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/lib/providers/trpc-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
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
        <AuthProvider>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
