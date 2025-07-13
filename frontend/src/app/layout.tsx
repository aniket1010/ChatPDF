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
      <body className={`${manrope.className} antialiased`} suppressHydrationWarning={true}>
        <div className="h-screen bg-white overflow-hidden">
          {/* Fixed Sidebar - Hidden on mobile */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main 
            className="h-full bg-white md:ml-[var(--sidebar-width,320px)]"
            style={{
              transition: 'margin-left 0.4s ease-out',
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
