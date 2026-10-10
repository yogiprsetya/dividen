import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Radar } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Radar Dividend",
  description: "Dividend Capture Screener for IDX",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2 font-bold">
                  <Radar className="h-5 w-5 text-primary" />
                  <span>Radar Dividend</span>
                </div>
              </div>
            </header>
            <main className="flex-1 container px-4 md:px-8 py-6">
              {children}
            </main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 px-4 md:px-8 md:h-14 md:flex-row">
                <p className="text-sm leading-loose text-muted-foreground text-center md:text-left">
                  Built for IDX retail investors. 100% client-side.
                </p>
              </div>
            </footer>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
