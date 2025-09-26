"use client";

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
  return (
    <div className="flex items-center space-x-4">
      {lastSync && (
        <span className="text-sm text-gray-400">
          最終同期: {formatLastSync(lastSync)}
        </span>
      )}

      <button
        type="button"
        onClick={onSync}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          loading
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
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
