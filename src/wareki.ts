/**
 * 和暦⇔西暦変換ライブラリ
 *
 * - 対応元号は 大正・昭和・平成・令和。
 * - Date はローカルタイムの年月日として解釈する（時刻部分は無視する）。
 * - 不正な入力（範囲外の日付・存在しない日付・0年以下など）には RangeError を投げる。
 *
 * 元号の開始日:
 *   大正 1912-07-30 / 昭和 1926-12-25 / 平成 1989-01-08 / 令和 2019-05-01
 */

export type Era = "大正" | "昭和" | "平成" | "令和";

export interface Wareki {
  era: Era;
  /** 元号での年（元年は 1） */
  year: number;
  /** 月（1〜12） */
  month: number;
  /** 日（1〜31） */
  day: number;
}

/**
 * 西暦の日付を和暦に変換する。
 * @throws {RangeError} 大正より前の日付、または不正な Date の場合
 */
export function toWareki(date: Date): Wareki {
  throw new Error("not implemented");
}

/**
 * 西暦の日付を和暦文字列に変換する。例: 「令和元年5月1日」
 * 1年は「元年」と表記し、数字は半角・ゼロ埋めなし。
 * @throws {RangeError} toWareki と同じ条件
 */
export function formatWareki(date: Date): string {
  throw new Error("not implemented");
}

/**
 * 和暦を西暦の Date（ローカルタイムの 0時0分0秒）に変換する。
 * @throws {RangeError} 元号の範囲外の日付、存在しない日付、0年以下、整数でない値、未知の元号の場合
 */
export function toSeireki(era: Era, year: number, month: number, day: number): Date {
  throw new Error("not implemented");
}
