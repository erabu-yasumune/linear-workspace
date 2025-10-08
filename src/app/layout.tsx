import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";
import { cookies } from "next/headers";
import { THEMES, type ThemeKey } from "@/app/actions/theme.types";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: " Chart",
  description: "Linear issues displayed in Gantt chart format",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const theme: ThemeKey =
    themeCookie && THEMES.includes(themeCookie as ThemeKey)
      ? (themeCookie as ThemeKey)
      : "black";

  return (
    <html lang="ja" data-theme={theme} suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
        <meta name="theme-color" content="hsl(var(--background))" />
      </head>
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
