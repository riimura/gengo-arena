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

/** 西暦の年月日（month は 1 始まり） */
interface YMD {
  year: number;
  month: number;
  day: number;
}

interface EraDef {
  name: Era;
  /** 元号の開始日（この日を含む） */
  start: YMD;
}

/** 開始日の古い順。各元号の終わりは次の元号の開始日の前日。最後の元号（令和）に終わりはない。 */
const ERAS: readonly EraDef[] = [
  { name: "大正", start: { year: 1912, month: 7, day: 30 } },
  { name: "昭和", start: { year: 1926, month: 12, day: 25 } },
  { name: "平成", start: { year: 1989, month: 1, day: 8 } },
  { name: "令和", start: { year: 2019, month: 5, day: 1 } },
];

/**
 * 年月日を大小比較できる整数（YYYYMMDD）にする。
 * Date のミリ秒で比較しないことで、時刻・タイムゾーン・夏時間の影響を受けない。
 */
const toKey = ({ year, month, day }: YMD): number => year * 10000 + month * 100 + day;

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/** 整数でなければ、どの項目がどんな値だったかをメッセージに入れて RangeError を投げる */
const assertInteger = (label: string, value: number): void => {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label}は整数で指定してください: ${value}`);
  }
};

/**
 * 西暦の日付を和暦に変換する。
 * @throws {RangeError} 大正より前の日付、または不正な Date の場合
 */
export function toWareki(date: Date): Wareki {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("不正な Date です");
  }

  const ymd: YMD = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  const key = toKey(ymd);

  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (key >= toKey(era.start)) {
      return { era: era.name, year: ymd.year - era.start.year + 1, month: ymd.month, day: ymd.day };
    }
  }

  throw new RangeError(`対応範囲外の日付です（大正元年7月30日より前）: ${ymd.year}-${ymd.month}-${ymd.day}`);
}

/**
 * 西暦の日付を和暦文字列に変換する。例: 「令和元年5月1日」
 * 1年は「元年」と表記し、数字は半角・ゼロ埋めなし。
 * @throws {RangeError} toWareki と同じ条件
 */
export function formatWareki(date: Date): string {
  const { era, year, month, day } = toWareki(date);
  return `${era}${year === 1 ? "元" : year}年${month}月${day}日`;
}

/**
 * 和暦を西暦の Date（ローカルタイムの 0時0分0秒）に変換する。
 *
 * 注意: 夏時間が始まる日など、ローカルタイムに 0時0分が存在しない日は、その日の最初の時刻を返す
 * （例: TZ=Asia/Tokyo の 1948-05-02 は 1時0分）。年月日は正しいので、toWareki に戻すと元の和暦になる。
 *
 * @throws {RangeError} 元号の範囲外の日付、存在しない日付、0年以下、整数でない値、未知の元号の場合
 */
export function toSeireki(era: Era, year: number, month: number, day: number): Date {
  const index = ERAS.findIndex((e) => e.name === era);
  if (index === -1) {
    throw new RangeError(`対応していない元号です: ${String(era)}`);
  }
  assertInteger("年", year);
  assertInteger("月", month);
  assertInteger("日", day);
  if (year < 1) {
    throw new RangeError(`年は1以上で指定してください: ${year}`);
  }

  const def = ERAS[index];
  const ymd: YMD = { year: def.start.year + year - 1, month, day };

  // Date に渡すと 2月30日→3月2日 のように繰り上がってしまうため、先に自前で検証する
  if (month < 1 || month > 12) {
    throw new RangeError(`月は1〜12で指定してください: ${month}`);
  }
  if (day < 1 || day > daysInMonth(ymd.year, month)) {
    throw new RangeError(`存在しない日付です: ${era}${year}年${month}月${day}日`);
  }

  const key = toKey(ymd);
  const next = ERAS[index + 1];
  if (key < toKey(def.start) || (next !== undefined && key >= toKey(next.start))) {
    throw new RangeError(`${era}の範囲外の日付です: ${era}${year}年${month}月${day}日`);
  }

  return new Date(ymd.year, month - 1, day);
}
