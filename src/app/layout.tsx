import type { Metadata } from "next";
import "./globals.css";
import "./flashcard.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title:       "4,000 Essential English Words — Admin",
  description: "Academic English Learning Platform — Admin Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
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
