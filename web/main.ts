/// <reference types="vite/client" />
import { fromDate, toSeireki, toWareki, type Era, type SeirekiDate } from "../src/wareki";

// 対応範囲は大正の開始日から。終わりはデモ用に区切っている。
const FIRST: SeirekiDate = { year: 1912, month: 7, day: 30 };
const LAST: SeirekiDate = { year: 2035, month: 12, day: 31 };

/** 元号の開始日（帯と目盛りを描くため。判定そのものは toWareki に任せる） */
const ERA_STARTS: readonly { era: Era; start: SeirekiDate }[] = [
  { era: "大正", start: FIRST },
  { era: "昭和", start: { year: 1926, month: 12, day: 25 } },
  { era: "平成", start: { year: 1989, month: 1, day: 8 } },
  { era: "令和", start: { year: 2019, month: 5, day: 1 } },
];

const ERA_CLASS: Record<Era, string> = { 大正: "taisho", 昭和: "showa", 平成: "heisei", 令和: "reiwa" };

const NOTES: Record<string, string> = {
  "大正-1": "大正元年は 7月30日から。",
  "昭和-1": "昭和元年は 12月25日〜31日 の7日間だけ。",
  "昭和-64": "昭和64年は 1月1日〜7日 の7日間だけ。",
  "平成-31": "平成31年は 4月30日まで。翌日から令和。",
};

// ---- 日数 ⇔ 年月日。UTC で数えるので夏時間の影響を受けない ----
const DAY_MS = 86_400_000;
const dayNum = ({ year, month, day }: SeirekiDate): number => Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
const fromDayNum = (n: number): SeirekiDate => {
  const d = new Date(n * DAY_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

const START = dayNum(FIRST);
const END = dayNum(LAST);
const TODAY = Math.min(Math.max(dayNum(fromDate(new Date())), START), END);

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} がありません`);
  return el as T;
}

const slider = $<HTMLInputElement>("slider");
const readout = $("readout");
const seal = $("seal");
const playButton = $<HTMLButtonElement>("play");
const picker = $<HTMLInputElement>("picker");

slider.min = "0";
slider.max = String(END - START);

// ---- 元号の帯と目盛り ----
ERA_STARTS.forEach(({ era, start }, i) => {
  const from = dayNum(start);
  const next = ERA_STARTS[i + 1];
  const to = next ? dayNum(next.start) : END + 1;

  const segment = document.createElement("span");
  segment.className = ERA_CLASS[era];
  segment.style.flex = `${to - from} 0 0`;
  segment.title = era;
  $("band").appendChild(segment);

  const tick = document.createElement("span");
  tick.style.left = `${((from - START) / (END - START)) * 100}%`;
  tick.style.whiteSpace = "pre";
  tick.textContent = `${era}\n${start.year}`;
  $("ticks").appendChild(tick);
});

// ---- 表示 ----
const pad2 = (n: number) => String(n).padStart(2, "0");
let lastEra: Era | null = null;
let lastGannen = false;

function show(n: number, { stamp = true } = {}): void {
  const date = fromDayNum(n);
  const w = toWareki(date);
  const gannen = w.year === 1;
  const yearText = gannen ? "元" : String(w.year);

  $("era").textContent = w.era;
  $("rest").textContent = `${yearText}年${w.month}月${w.day}日`;
  $("seireki").textContent = `西暦 ${date.year}年${date.month}月${date.day}日${n === TODAY ? "（今日）" : ""}`;
  $("note").textContent = NOTES[`${w.era}-${w.year}`] ?? "";
  readout.style.setProperty("--era", `var(--${ERA_CLASS[w.era]})`);

  const eraChanged = lastEra !== null && w.era !== lastEra;
  const enteredGannen = lastEra !== null && gannen && !lastGannen;
  if (stamp && (eraChanged || enteredGannen)) {
    seal.textContent = eraChanged ? "改元" : "元年";
    seal.classList.remove("show");
    void seal.offsetWidth; // アニメーションをやり直すため
    seal.classList.add("show");
  } else if (!gannen && w.era === lastEra) {
    seal.classList.remove("show");
  }
  lastEra = w.era;
  lastGannen = gannen;

  slider.value = String(n - START);
  slider.setAttribute("aria-valuetext", `${w.era}${yearText}年${w.month}月${w.day}日`);
  picker.value = `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

// ---- 大正から今日まで再生 ----
let frame = 0;

function stop(): void {
  cancelAnimationFrame(frame);
  frame = 0;
  playButton.textContent = "▶ 大正から再生";
}

function play(): void {
  if (frame) return stop();
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reduceMotion ? 1 : 9000;
  const startedAt = performance.now();
  playButton.textContent = "■ 止める";
  lastEra = null;

  const step = (t: number) => {
    const p = Math.min(1, (t - startedAt) / duration);
    const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    show(Math.round(START + (TODAY - START) * eased));
    if (p < 1) frame = requestAnimationFrame(step);
    else stop();
  };
  frame = requestAnimationFrame(step);
}

slider.addEventListener("input", () => {
  stop();
  show(START + Number(slider.value));
});
playButton.addEventListener("click", play);
$("today").addEventListener("click", () => {
  stop();
  show(TODAY);
});
picker.addEventListener("change", () => {
  const [year, month, day] = picker.value.split("-").map(Number);
  if (!year) return;
  stop();
  const n = dayNum({ year, month, day });
  if (n < START || n > END) {
    $("note").textContent = "1912年7月30日〜2035年12月31日 の日付を選んでください。";
    return;
  }
  show(n);
});

// ---- 和暦 → 西暦 ----
const eraSelect = $<HTMLSelectElement>("r-era");
const fields = ["r-year", "r-month", "r-day"].map((id) => $<HTMLInputElement>(id));
const output = $("r-out");

function convert(): void {
  const [year, month, day] = fields.map((f) => (f.value.trim() === "" ? Number.NaN : Number(f.value)));
  try {
    const date = toSeireki(eraSelect.value as Era, year, month, day);
    output.classList.remove("error");
    output.textContent = `西暦 ${date.year}年${date.month}月${date.day}日`;
    const n = dayNum(date);
    if (n >= START && n <= END) show(n);
  } catch (error) {
    output.classList.add("error");
    output.textContent = error instanceof Error ? error.message : String(error);
  }
}

[eraSelect, ...fields].forEach((el) => el.addEventListener("input", convert));
document.querySelectorAll<HTMLButtonElement>("[data-try]").forEach((button) => {
  button.addEventListener("click", () => {
    const [era, ...nums] = (button.dataset.try ?? "").split(",");
    eraSelect.value = era;
    fields.forEach((f, i) => (f.value = nums[i]));
    convert();
  });
});

convert();
show(TODAY, { stamp: false });

// ---- オフライン対応（公開用のビルドだけ。npm run dev では登録しない） ----
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("サービスワーカーを登録できませんでした", error));
  });
}
