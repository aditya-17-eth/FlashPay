import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "FlashPay | Pay-per-use AI Toolkit",
  description: "AI tools. Pay per use. No subscription. Powered by Stellar.",
};

import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "./QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen pb-12 bg-black text-white">
        <QueryProvider>
          <Navbar />
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
