/**
 * 和暦⇔西暦変換ライブラリ
 *
 * - 対応元号は 大正・昭和・平成・令和。
 * - 西暦の日付は時刻やタイムゾーンを持たない年月日（SeirekiDate）で受け渡しする。
 *   Date を使う場合は fromDate でローカルタイムの年月日に変換してから渡す。
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

/** 西暦の年月日。時刻とタイムゾーンを持たないので、夏時間などの影響を受けない。 */
export interface SeirekiDate {
  year: number;
  /** 月（1〜12） */
  month: number;
  /** 日（1〜31） */
  day: number;
}

interface EraDef {
  name: Era;
  /** 元号の開始日（この日を含む） */
  start: SeirekiDate;
}

/** 開始日の古い順。各元号の終わりは次の元号の開始日の前日。最後の元号（令和）に終わりはない。 */
const ERAS: readonly EraDef[] = [
  { name: "大正", start: { year: 1912, month: 7, day: 30 } },
  { name: "昭和", start: { year: 1926, month: 12, day: 25 } },
  { name: "平成", start: { year: 1989, month: 1, day: 8 } },
  { name: "令和", start: { year: 2019, month: 5, day: 1 } },
];

/** 年月日を大小比較できる整数（YYYYMMDD）にする */
const toKey = ({ year, month, day }: SeirekiDate): number => year * 10000 + month * 100 + day;

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
 * 西暦の年月日が実在する日付かを確かめる。
 * @param text エラーメッセージに出す日付の表記（和暦で入力された場合は和暦で出すため）
 */
const assertExistingDate = ({ year, month, day }: SeirekiDate, text: string): void => {
  assertInteger("年", year);
  assertInteger("月", month);
  assertInteger("日", day);
  if (month < 1 || month > 12) {
    throw new RangeError(`月は1〜12で指定してください: ${month}`);
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(`存在しない日付です: ${text}`);
  }
};

/**
 * Date をローカルタイムの年月日に変換する（時刻部分は無視する）。
 * 引数の Date は変更しない。
 * @throws {RangeError} Date でない値、または Invalid Date の場合
 */
export function fromDate(date: Date): SeirekiDate {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("不正な Date です");
  }
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * 西暦の年月日を和暦に変換する。
 * @throws {RangeError} 大正より前の日付、存在しない日付、整数でない値の場合
 */
export function toWareki(date: SeirekiDate): Wareki {
  if (date instanceof Date) {
    throw new RangeError("Date ではなく { year, month, day } を渡してください（Date は fromDate で変換できます）");
  }
  if (typeof date !== "object" || date === null) {
    throw new RangeError(`不正な日付です: ${String(date)}`);
  }
  const { year, month, day } = date;
  assertExistingDate(date, `${year}-${month}-${day}`);

  const key = toKey(date);
  for (let i = ERAS.length - 1; i >= 0; i--) {
    const era = ERAS[i];
    if (key >= toKey(era.start)) {
      return { era: era.name, year: year - era.start.year + 1, month, day };
    }
  }

  throw new RangeError(`対応範囲外の日付です（大正元年7月30日より前）: ${year}-${month}-${day}`);
}

/**
 * 西暦の年月日を和暦文字列に変換する。例: 「令和元年5月1日」
 * 1年は「元年」と表記し、数字は半角・ゼロ埋めなし。
 * @throws {RangeError} toWareki と同じ条件
 */
export function formatWareki(date: SeirekiDate): string {
  const { era, year, month, day } = toWareki(date);
  return `${era}${year === 1 ? "元" : year}年${month}月${day}日`;
}

/**
 * 和暦を西暦の年月日に変換する。
 * @throws {RangeError} 元号の範囲外の日付、存在しない日付、0年以下、整数でない値、未知の元号の場合
 */
export function toSeireki(era: Era, year: number, month: number, day: number): SeirekiDate {
  const index = ERAS.findIndex((e) => e.name === era);
  if (index === -1) {
    throw new RangeError(`対応していない元号です: ${String(era)}`);
  }
  assertInteger("年", year);
  if (year < 1) {
    throw new RangeError(`年は1以上で指定してください: ${year}`);
  }

  const def = ERAS[index];
  const seireki: SeirekiDate = { year: def.start.year + year - 1, month, day };
  const text = `${era}${year}年${month}月${day}日`;
  assertExistingDate(seireki, text);

  const key = toKey(seireki);
  const next = ERAS[index + 1];
  if (key < toKey(def.start) || (next !== undefined && key >= toKey(next.start))) {
    throw new RangeError(`${era}の範囲外の日付です: ${text}`);
  }

  return seireki;
}
