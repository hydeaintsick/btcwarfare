import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "BTCWarfare - Battle P2P Crypto",
  description: "Battle P2P platform for betting on Bitcoin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Header />
          <div className="pt-20">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

