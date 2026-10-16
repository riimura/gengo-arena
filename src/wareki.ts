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

interface EraDefinition {
  name: Era;
  /** 開始日（この日を含む）の西暦年月日 */
  start: { year: number; month: number; day: number };
}

/** 開始日の古い順に並べる。次の元号の開始日の前日がその元号の最終日になる。 */
const ERAS: readonly EraDefinition[] = [
  { name: "大正", start: { year: 1912, month: 7, day: 30 } },
  { name: "昭和", start: { year: 1926, month: 12, day: 25 } },
  { name: "平成", start: { year: 1989, month: 1, day: 8 } },
  { name: "令和", start: { year: 2019, month: 5, day: 1 } },
];

/** 年月日を大小比較できる整数（例: 2019-05-01 → 20190501）にする */
const dateKey = (year: number, month: number, day: number): number => year * 10000 + month * 100 + day;

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/**
 * 西暦の日付を和暦に変換する。
 * @throws {RangeError} 大正より前の日付、または不正な Date の場合
 */
export function toWareki(date: Date): Wareki {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("不正な日付です");
  }

  // ローカルタイムの年月日だけを取り出す（引数の Date は変更しない）
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const key = dateKey(year, month, day);

  for (let i = ERAS.length - 1; i >= 0; i--) {
    const { name, start } = ERAS[i];
    if (key >= dateKey(start.year, start.month, start.day)) {
      // 元号の年は西暦の1月1日で切り替わる
      return { era: name, year: year - start.year + 1, month, day };
    }
  }

  throw new RangeError(`対応していない日付です（大正より前）: ${year}-${month}-${day}`);
}

/**
 * 西暦の日付を和暦文字列に変換する。例: 「令和元年5月1日」
 * 1年は「元年」と表記し、数字は半角・ゼロ埋めなし。
 * @throws {RangeError} toWareki と同じ条件
 */
export function formatWareki(date: Date): string {
  const { era, year, month, day } = toWareki(date);
  const yearText = year === 1 ? "元" : String(year);
  return `${era}${yearText}年${month}月${day}日`;
}

/**
 * 和暦を西暦の Date（ローカルタイムの 0時0分0秒）に変換する。
 * @throws {RangeError} 元号の範囲外の日付、存在しない日付、0年以下、整数でない値、未知の元号の場合
 */
export function toSeireki(era: Era, year: number, month: number, day: number): Date {
  const index = ERAS.findIndex((e) => e.name === era);
  if (index === -1) {
    throw new RangeError(`対応していない元号です: ${String(era)}`);
  }
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError("年・月・日は整数で指定してください");
  }
  if (year < 1) {
    throw new RangeError(`年は1以上で指定してください: ${year}`);
  }

  const { start } = ERAS[index];
  const seirekiYear = start.year + year - 1;

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(seirekiYear, month)) {
    throw new RangeError(`存在しない日付です: ${era}${year}年${month}月${day}日`);
  }

  const key = dateKey(seirekiYear, month, day);
  const next = ERAS[index + 1];
  if (
    key < dateKey(start.year, start.month, start.day) ||
    (next !== undefined && key >= dateKey(next.start.year, next.start.month, next.start.day))
  ) {
    throw new RangeError(`${era}の範囲外の日付です: ${era}${year}年${month}月${day}日`);
  }

  return new Date(seirekiYear, month - 1, day);
}
