import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./flashcard.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title:       "4,000 Essential English Words — Admin",
  description: "Academic English Learning Platform — Admin Panel",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>

        <footer className="mt-auto py-10 border-t border-border/40">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground/60 tracking-wider">
              Designed & Developed by <span className="text-foreground/80 font-bold">Ali Jitam ❤️</span>
            </p>
            <div className="h-px w-8 bg-border/50" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">
              © 2026 Elite English Mentor
            </p>
          </div>
        </footer>

        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(222 40% 11%)",
              border:     "1px solid hsl(217 30% 20%)",
              color:      "hsl(210 40% 93%)",
            },
          }}
        />
      </body>
    </html>
  );
}
