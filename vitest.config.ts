import { defineConfig } from "vitest/config";

// 日付はローカルタイムで解釈する仕様のため、実行環境によらず結果が変わらないよう
// タイムゾーンを日本時間に固定する（ワーカープロセスはこの環境変数を引き継ぐ）。
process.env.TZ = "Asia/Tokyo";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
