"use client";
// 월 달력 (사례: 시대인재N 학부모 앱 출결 현황 — 날짜별 색 점 + 아래 상세)
import { TODAY } from "@/lib/seed";

export type Dot = "present" | "late" | "absent" | "makeup" | "available" | "planned" | "leveltest";
const DOT: Record<Dot, string> = {
  present: "bg-success",
  late: "bg-warning",
  absent: "bg-danger",
  makeup: "bg-brand",
  available: "bg-brand",
  planned: "border border-grey-400", // 앞으로의 수업: 빈 점
  leveltest: "bg-grey-700", // 정기 레벨테스트 (2월·8월)
};
export const DOT_LABEL: Record<Dot, string> = { present: "출석", late: "지각", absent: "결석", makeup: "보강", available: "신청 가능", planned: "예정", leveltest: "레벨테스트" };

export function MonthCalendar({
  month,
  dots,
  selected,
  onSelect,
  selectable,
}: {
  month: string; // "2026-10"
  dots: Record<string, Dot[]>;
  selected: string | null;
  onSelect: (date: string) => void;
  selectable?: (date: string) => boolean; // 없으면 점이 있는 날만 선택 가능
}) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1).getDay();
  const last = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null)];
  for (let d = 1; d <= last; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-[12px] text-grey-500">
        {"일월화수목금토".split("").map((w, i) => (
          <span key={w} className={`py-1 ${i === 0 ? "text-danger" : ""}`}>
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const ds = dots[d] ?? [];
          const can = selectable ? selectable(d) : ds.length > 0;
          const isSel = d === selected;
          return (
            <button
              key={d}
              disabled={!can}
              onClick={() => onSelect(d)}
              className={`mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-[14px] transition-colors ${
                isSel ? "bg-grey-900 font-bold text-white" : can ? "font-semibold active:bg-grey-100" : "text-grey-400"
              } ${d === TODAY && !isSel ? "ring-1 ring-grey-400" : ""}`}
            >
              {Number(d.slice(8))}
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {ds.slice(0, 3).map((t, k) => (
                  <span key={k} className={`size-1.5 rounded-full ${isSel ? (t === "planned" ? "border border-white" : "bg-white") : DOT[t]}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DotLegend({ items }: { items: Dot[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-[12px] text-grey-500">
      {items.map((t) => (
        <span key={t} className="flex items-center gap-1">
          <span className={`size-2 rounded-full ${DOT[t]}`} />
          {DOT_LABEL[t]}
        </span>
      ))}
    </div>
  );
}
