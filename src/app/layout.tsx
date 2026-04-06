import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Italian Learning App",
  description: "Leggere と Ascoltare を中心に学べるイタリア語学習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 md:px-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
