"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

interface SyncButtonProps {
  onSync: () => void;
  loading: boolean;
  lastSync: Date | null;
}

function formatLastSync(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes === 0) {
    return "今同期しました";
  } else if (diffMinutes === 1) {
    return "1分前";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else {
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}時間前`;
  }
}

export function SyncButton({ onSync, loading, lastSync }: SyncButtonProps) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // 1分ごとにコンポーネントを強制再レンダリングして最終同期時刻を更新
    const timer = setInterval(() => {
      forceUpdate({});
    }, 60000); // 60秒 = 60000ミリ秒

    // コンポーネントのクリーンアップ時にタイマーを削除
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-4">
      {lastSync && (
        <span className="text-sm opacity-60">
          最終同期: {formatLastSync(lastSync)}
        </span>
      )}

      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          loading
            ? "bg-primary/20 opacity-50 cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:opacity-80"
        }`}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <Icon name="sync" className="animate-spin" />
            <span>同期中...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Icon name="sync" />
            <span>同期</span>
          </div>
        )}
      </button>
    </div>
  );
}
