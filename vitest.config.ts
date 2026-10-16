import { defineConfig } from "vitest/config";

// 日付はローカルタイムで解釈する仕様のため、実行環境によらず結果が変わらないよう
// タイムゾーンを日本時間に固定する（ワーカープロセスはこの環境変数を引き継ぐ）。
// ただし TZ が指定されていればそちらを優先する。CI では TZ=UTC でも回して、
// タイムゾーンによって結果が変わらないことを確かめる。
process.env.TZ ||= "Asia/Tokyo";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
