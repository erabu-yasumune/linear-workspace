"use server";

import { cookies } from "next/headers";
import { THEMES, type ThemeKey } from "./theme.types";

/**
 * テーマをCookieに保存するサーバーアクション
 * ホワイトリスト検証を実施
 */
export async function setTheme(theme: string) {
  // ホワイトリスト検証
  if (!THEMES.includes(theme as ThemeKey)) {
    throw new Error(
      `Invalid theme: ${theme}. Must be one of: ${THEMES.join(", ")}`,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("theme", theme, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1年間
  });

  return { ok: true };
}
