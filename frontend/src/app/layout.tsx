import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css"
import "../styles/markdown.css"
import "../styles/html-content.css";
import { Sidebar } from "@/components";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatPDF",
  description: "Chat with your PDF documents using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.className} antialiased`}>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:flex md:h-full">
            <Sidebar />
          </div>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
