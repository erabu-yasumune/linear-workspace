"use client";

import { startTransition, useEffect, useState } from "react";
import { setTheme } from "@/app/actions/setTheme";
import { THEMES, type ThemeKey } from "@/app/actions/theme.types";

const THEME_LABELS: Record<ThemeKey, string> = {
  black: "ブラック",
  white: "ホワイト",
};

export function ThemeSelect() {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("black");

  useEffect(() => {
    // 初期値をHTMLのdata-theme属性から取得
    const theme = document.documentElement.getAttribute(
      "data-theme",
    ) as ThemeKey;
    if (theme && THEMES.includes(theme)) {
      setCurrentTheme(theme);
    }

    // theme-colorメタタグを更新
    const updateThemeColor = () => {
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", `hsl(${bgColor})`);
      }
    };
    updateThemeColor();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as ThemeKey;

    // 即座にDOM更新（UX向上）
    document.documentElement.setAttribute("data-theme", newTheme);
    setCurrentTheme(newTheme);

    // theme-colorメタタグを更新
    setTimeout(() => {
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", `hsl(${bgColor})`);
      }
    }, 0);

    // サーバーアクションでCookie永続化
    startTransition(() => {
      setTheme(newTheme).catch((error) => {
        console.error("テーマの保存に失敗しました:", error);
      });
    });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <label htmlFor="theme-select" className="text-sm font-medium">
        テーマ:
      </label>
      <select
        id="theme-select"
        value={currentTheme}
        onChange={handleChange}
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:opacity-80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {THEMES.map((theme) => (
          <option key={theme} value={theme}>
            {THEME_LABELS[theme]}
          </option>
        ))}
      </select>
    </div>
  );
}
