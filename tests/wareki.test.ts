import { describe, expect, it } from "vitest";
import { formatWareki, toSeireki, toWareki, type Era, type Wareki } from "../src/wareki";

/** ローカルタイムの年月日から Date を作る（month は 1 始まり） */
const d = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0) =>
  new Date(year, month - 1, day, hours, minutes, seconds, ms);

const w = (era: Era, year: number, month: number, day: number): Wareki => ({ era, year, month, day });

/** 西暦 → 和暦 の対応表（toWareki / toSeireki の両方で使う） */
type Case = { name: string; seireki: [number, number, number]; wareki: Wareki; text: string };

const representativeCases: Case[] = [
  { name: "大正の代表日", seireki: [1920, 1, 1], wareki: w("大正", 9, 1, 1), text: "大正9年1月1日" },
  { name: "昭和の代表日", seireki: [1964, 10, 10], wareki: w("昭和", 39, 10, 10), text: "昭和39年10月10日" },
  { name: "平成の代表日", seireki: [2000, 2, 29], wareki: w("平成", 12, 2, 29), text: "平成12年2月29日" },
  { name: "令和の代表日", seireki: [2024, 6, 15], wareki: w("令和", 6, 6, 15), text: "令和6年6月15日" },
  { name: "令和の年末", seireki: [2026, 12, 31], wareki: w("令和", 8, 12, 31), text: "令和8年12月31日" },
];

const boundaryCases: Case[] = [
  { name: "大正の開始日", seireki: [1912, 7, 30], wareki: w("大正", 1, 7, 30), text: "大正元年7月30日" },
  { name: "大正の最終日", seireki: [1926, 12, 24], wareki: w("大正", 15, 12, 24), text: "大正15年12月24日" },
  { name: "昭和の開始日", seireki: [1926, 12, 25], wareki: w("昭和", 1, 12, 25), text: "昭和元年12月25日" },
  { name: "昭和の最終日", seireki: [1989, 1, 7], wareki: w("昭和", 64, 1, 7), text: "昭和64年1月7日" },
  { name: "平成の開始日", seireki: [1989, 1, 8], wareki: w("平成", 1, 1, 8), text: "平成元年1月8日" },
  { name: "平成の最終日", seireki: [2019, 4, 30], wareki: w("平成", 31, 4, 30), text: "平成31年4月30日" },
  { name: "令和の開始日", seireki: [2019, 5, 1], wareki: w("令和", 1, 5, 1), text: "令和元年5月1日" },
];

/** 元年の途中・年をまたいだ直後（「元年」→「2年」への切り替わり） */
const gannenCases: Case[] = [
  { name: "大正元年の年末", seireki: [1912, 12, 31], wareki: w("大正", 1, 12, 31), text: "大正元年12月31日" },
  { name: "大正2年の元日", seireki: [1913, 1, 1], wareki: w("大正", 2, 1, 1), text: "大正2年1月1日" },
  { name: "昭和元年の年末", seireki: [1926, 12, 31], wareki: w("昭和", 1, 12, 31), text: "昭和元年12月31日" },
  { name: "昭和2年の元日", seireki: [1927, 1, 1], wareki: w("昭和", 2, 1, 1), text: "昭和2年1月1日" },
  { name: "平成元年の年末", seireki: [1989, 12, 31], wareki: w("平成", 1, 12, 31), text: "平成元年12月31日" },
  { name: "平成2年の元日", seireki: [1990, 1, 1], wareki: w("平成", 2, 1, 1), text: "平成2年1月1日" },
  { name: "令和元年の年末", seireki: [2019, 12, 31], wareki: w("令和", 1, 12, 31), text: "令和元年12月31日" },
  { name: "令和2年の元日", seireki: [2020, 1, 1], wareki: w("令和", 2, 1, 1), text: "令和2年1月1日" },
];

const allCases = [...representativeCases, ...boundaryCases, ...gannenCases];

describe("toWareki", () => {
  describe("正常系：各元号の代表的な日付", () => {
    it.each(representativeCases)("$name: $text", ({ seireki, wareki }) => {
      expect(toWareki(d(...seireki))).toEqual(wareki);
    });
  });

  describe("境界値：各元号の開始日と最終日", () => {
    it.each(boundaryCases)("$name: $text", ({ seireki, wareki }) => {
      expect(toWareki(d(...seireki))).toEqual(wareki);
    });
  });

  describe("元年と2年の切り替わり", () => {
    it.each(gannenCases)("$name: $text", ({ seireki, wareki }) => {
      expect(toWareki(d(...seireki))).toEqual(wareki);
    });
  });

  describe("時刻部分は無視して日付で判定する", () => {
    it("平成最終日の 23:59:59.999 は平成31年4月30日", () => {
      expect(toWareki(d(2019, 4, 30, 23, 59, 59, 999))).toEqual(w("平成", 31, 4, 30));
    });

    it("令和開始日の 00:00:00.000 は令和元年5月1日", () => {
      expect(toWareki(d(2019, 5, 1, 0, 0, 0, 0))).toEqual(w("令和", 1, 5, 1));
    });

    it("昭和最終日の正午は昭和64年1月7日", () => {
      expect(toWareki(d(1989, 1, 7, 12, 0, 0))).toEqual(w("昭和", 64, 1, 7));
    });
  });

  it("引数の Date を変更しない", () => {
    const date = d(2019, 5, 1, 15, 30);
    const before = date.getTime();
    toWareki(date);
    expect(date.getTime()).toBe(before);
  });

  describe("異常系", () => {
    it("大正開始日の前日（1912-07-29）は例外", () => {
      expect(() => toWareki(d(1912, 7, 29))).toThrow(RangeError);
    });

    it("大正開始日の前日 23:59:59.999 は例外", () => {
      expect(() => toWareki(d(1912, 7, 29, 23, 59, 59, 999))).toThrow(RangeError);
    });

    it("明治の日付（1900-01-01）は例外", () => {
      expect(() => toWareki(d(1900, 1, 1))).toThrow(RangeError);
    });

    it("Invalid Date は例外", () => {
      expect(() => toWareki(new Date(Number.NaN))).toThrow(RangeError);
    });
  });
});

describe("formatWareki", () => {
  describe("正常系・境界値・元年表記", () => {
    it.each(allCases)("$name: $text", ({ seireki, text }) => {
      expect(formatWareki(d(...seireki))).toBe(text);
    });
  });

  describe("元年表記", () => {
    it("1年は「元年」と表記し「1年」とは書かない", () => {
      const text = formatWareki(d(2019, 5, 1));
      expect(text).toBe("令和元年5月1日");
      expect(text).not.toContain("1年");
    });

    it("2年は「2年」と表記する", () => {
      expect(formatWareki(d(2020, 5, 1))).toBe("令和2年5月1日");
    });

    it("10年・11年など1で終わる2桁の年は「元年」にしない", () => {
      expect(formatWareki(d(1921, 1, 1))).toBe("大正10年1月1日");
      expect(formatWareki(d(1999, 1, 1))).toBe("平成11年1月1日");
    });
  });

  describe("数字の表記", () => {
    it("月日はゼロ埋めしない", () => {
      expect(formatWareki(d(2021, 1, 5))).toBe("令和3年1月5日");
    });

    it("2桁の月日はそのまま表記する", () => {
      expect(formatWareki(d(2021, 12, 31))).toBe("令和3年12月31日");
    });
  });

  describe("異常系", () => {
    it("大正より前の日付は例外", () => {
      expect(() => formatWareki(d(1912, 7, 29))).toThrow(RangeError);
    });

    it("Invalid Date は例外", () => {
      expect(() => formatWareki(new Date(Number.NaN))).toThrow(RangeError);
    });
  });
});

describe("toSeireki", () => {
  /** 返り値がローカルタイムの指定日 0:00:00.000 ちょうどであることを確認する */
  const expectLocalMidnight = (actual: Date, [year, month, day]: [number, number, number]) => {
    expect(actual).toBeInstanceOf(Date);
    expect(actual.getTime()).toBe(d(year, month, day).getTime());
  };

  describe("正常系：各元号の代表的な日付", () => {
    it.each(representativeCases)("$name: $text", ({ seireki, wareki }) => {
      expectLocalMidnight(toSeireki(wareki.era, wareki.year, wareki.month, wareki.day), seireki);
    });
  });

  describe("境界値：各元号の開始日と最終日", () => {
    it.each(boundaryCases)("$name: $text", ({ seireki, wareki }) => {
      expectLocalMidnight(toSeireki(wareki.era, wareki.year, wareki.month, wareki.day), seireki);
    });
  });

  describe("元年と2年の切り替わり", () => {
    it.each(gannenCases)("$name: $text", ({ seireki, wareki }) => {
      expectLocalMidnight(toSeireki(wareki.era, wareki.year, wareki.month, wareki.day), seireki);
    });
  });

  describe("うるう年", () => {
    it("令和2年（2020年）2月29日は存在する", () => {
      expectLocalMidnight(toSeireki("令和", 2, 2, 29), [2020, 2, 29]);
    });

    it("平成12年（2000年・400で割り切れる年）2月29日は存在する", () => {
      expectLocalMidnight(toSeireki("平成", 12, 2, 29), [2000, 2, 29]);
    });
  });

  describe("異常系：元号の範囲外の日付", () => {
    it.each<[string, Era, number, number, number]>([
      ["大正元年7月29日（大正開始日の前日）", "大正", 1, 7, 29],
      ["大正元年1月1日（大正開始前）", "大正", 1, 1, 1],
      ["大正15年12月25日（昭和開始日）", "大正", 15, 12, 25],
      ["大正16年1月1日（大正の範囲外の年）", "大正", 16, 1, 1],
      ["昭和元年12月24日（大正最終日）", "昭和", 1, 12, 24],
      ["昭和64年1月8日（平成開始日）", "昭和", 64, 1, 8],
      ["昭和65年1月1日（昭和の範囲外の年）", "昭和", 65, 1, 1],
      ["平成元年1月7日（昭和最終日）", "平成", 1, 1, 7],
      ["平成31年5月1日（令和開始日）", "平成", 31, 5, 1],
      ["平成32年1月1日（平成の範囲外の年）", "平成", 32, 1, 1],
      ["令和元年4月30日（平成最終日）", "令和", 1, 4, 30],
      ["令和元年1月1日（令和開始前）", "令和", 1, 1, 1],
    ])("%s は例外", (_label, era, year, month, day) => {
      expect(() => toSeireki(era, year, month, day)).toThrow(RangeError);
    });
  });

  describe("異常系：存在しない日付", () => {
    it.each<[string, Era, number, number, number]>([
      ["令和3年2月30日", "令和", 3, 2, 30],
      ["令和3年2月29日（2021年はうるう年でない）", "令和", 3, 2, 29],
      ["平成31年2月29日（2019年はうるう年でない）", "平成", 31, 2, 29],
      ["令和3年4月31日（小の月の31日）", "令和", 3, 4, 31],
      ["令和3年13月1日", "令和", 3, 13, 1],
      ["令和3年0月1日", "令和", 3, 0, 1],
      ["令和3年1月0日", "令和", 3, 1, 0],
      ["令和3年1月32日", "令和", 3, 1, 32],
      ["令和3年-1月1日", "令和", 3, -1, 1],
      ["令和3年1月-1日", "令和", 3, 1, -1],
    ])("%s は例外", (_label, era, year, month, day) => {
      expect(() => toSeireki(era, year, month, day)).toThrow(RangeError);
    });
  });

  describe("異常系：0年以下", () => {
    it.each<[string, Era, number]>([
      ["大正0年", "大正", 0],
      ["昭和0年", "昭和", 0],
      ["平成0年", "平成", 0],
      ["令和0年", "令和", 0],
      ["令和-1年", "令和", -1],
    ])("%s は例外", (_label, era, year) => {
      expect(() => toSeireki(era, year, 6, 1)).toThrow(RangeError);
    });
  });

  describe("異常系：整数でない値・不正な元号", () => {
    it.each<[string, Era, number, number, number]>([
      ["年が小数", "令和", 1.5, 6, 1],
      ["月が小数", "令和", 3, 6.5, 1],
      ["日が小数", "令和", 3, 6, 1.5],
      ["年が NaN", "令和", Number.NaN, 6, 1],
      ["年が Infinity", "令和", Number.POSITIVE_INFINITY, 6, 1],
    ])("%s は例外", (_label, era, year, month, day) => {
      expect(() => toSeireki(era, year, month, day)).toThrow(RangeError);
    });

    it("対応していない元号（明治）は例外", () => {
      expect(() => toSeireki("明治" as Era, 45, 1, 1)).toThrow(RangeError);
    });
  });
});

describe("往復変換", () => {
  it.each(allCases)("$name: toSeireki(toWareki(date)) は元の日付に戻る", ({ seireki }) => {
    const date = d(...seireki);
    const { era, year, month, day } = toWareki(date);
    expect(toSeireki(era, year, month, day).getTime()).toBe(date.getTime());
  });
});
