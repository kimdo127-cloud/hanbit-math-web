"use client";
// 수강 신청 탭 = 학원이 운영하는 강좌 전체 목록 (검색 → 필터 → 목록). 강좌를 누르면 상세에서 신청
// 탭 첫 화면이라 제목 헤더 없이 검색창이 맨 위. 다니는 강좌 확인·수강 중단은 MY > 자녀 상세
// 필터: 학년·요일 버튼 → 바텀시트에서 칩으로 여러 개 고르기(하나라도 맞으면 표시), [N개 강좌 보기]로 적용. 자리는 켜고 끄기
import { Check, ChevronDown, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader, WEEKDAY, markBack, won } from "@/components/ui";
import { GRADE_LABEL, listAllClasses } from "@/lib/api";
import type { Grade } from "@/lib/types";

type Row = Awaited<ReturnType<typeof listAllClasses>>[number];

// 필터 칩: 같은 너비 격자, 고르면 브랜드 색 테두리·글자 (검정 채움보다 눈이 편함). 옆에 해당 강좌 수
function Chip({ on, count, onClick, children }: { on: boolean; count: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      disabled={count === 0 && !on}
      className={`flex h-12 flex-col items-center justify-center rounded-xl border text-[15px] font-semibold transition-colors disabled:opacity-40 ${
        on ? "border-brand bg-brand-weak text-brand" : "border-grey-200 bg-white text-grey-700 active:bg-grey-50"
      }`}
    >
      {children}
      <span className={`text-[11px] font-normal ${on ? "text-brand" : "text-grey-400"}`}>{count}개 강좌</span>
    </button>
  );
}

export default function ClassesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [grades, setGrades] = useState<number[]>([]);
  const [days, setDays] = useState<number[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<{ grades: number[]; days: number[] }>({ grades: [], days: [] });

  useEffect(() => {
    listAllClasses().then(setRows);
  }, []);

  const gradeOpts = useMemo(
    () => ([...new Set(rows?.map((r) => r.target_grade) ?? [])].sort((a, b) => a - b) as Grade[]).map((g) => ({ value: g, label: GRADE_LABEL[g] })),
    [rows],
  );
  // 학원이 수업하는 요일만 보여 준다
  const dayOpts = useMemo(
    () => [...new Set(rows?.flatMap((r) => r.schedules.map((s) => s.weekday)) ?? [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => ({ value: d, label: WEEKDAY[d] })),
    [rows],
  );
  const match = (r: Row, g: number[], d: number[]) =>
    (g.length === 0 || g.includes(r.target_grade)) && (d.length === 0 || r.schedules.some((s) => d.includes(s.weekday)));
  const list = useMemo(() => {
    const k = q.trim();
    return (rows ?? [])
      .filter((r) => !k || r.name.includes(k) || r.teacherName.includes(k))
      .filter((r) => match(r, grades, days))
      .filter((r) => !openOnly || r.count < r.capacity)
      .sort((a, b) => a.target_grade - b.target_grade || a.name.localeCompare(b.name));
  }, [rows, q, grades, days, openOnly]);
  // 시트에서 고르는 중인 조건으로 미리 센 결과 수
  const draftCount = (rows ?? []).filter((r) => (!q.trim() || r.name.includes(q.trim()) || r.teacherName.includes(q.trim())) && match(r, draft.grades, draft.days) && (!openOnly || r.count < r.capacity)).length;
  const openSheet = () => {
    setDraft({ grades, days });
    setSheet(true);
  };
  const toggle = (arr: number[], v: number) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const label = (sel: number[], opts: { value: number; label: string }[], name: string) =>
    sel.length ? opts.filter((o) => sel.includes(o.value)).map((o) => o.label).join("·") : name;
  const filtered = !!q || grades.length > 0 || days.length > 0 || openOnly;

  return (
    <main className="pt-5">
      {!rows ? (
        <Loader />
      ) : (
        <div className="px-4">
          {/* 검색 */}
          <label className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4">
            <Search size={18} className="text-grey-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="강좌 이름, 선생님 검색"
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-grey-400"
            />
            {q && (
              <button aria-label="검색어 지우기" onClick={() => setQ("")} className="text-grey-400">
                <X size={18} />
              </button>
            )}
          </label>

          {/* 필터 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(
              [
                ["학년", grades, gradeOpts],
                ["요일", days, dayOpts],
              ] as const
            ).map(([name, sel, opts]) => (
              <button
                key={name}
                onClick={openSheet}
                className={`flex h-9 max-w-[160px] items-center gap-1 rounded-full border pr-2.5 pl-3.5 text-[14px] font-semibold ${
                  sel.length ? "border-grey-900 bg-grey-900 text-white" : "border-grey-200 bg-white text-grey-700"
                }`}
              >
                <span className="truncate">{label(sel, opts, name)}</span>
                <ChevronDown size={15} className={`shrink-0 ${sel.length ? "text-white" : "text-grey-500"}`} />
              </button>
            ))}
            <button
              onClick={() => setOpenOnly(!openOnly)}
              aria-pressed={openOnly}
              className={`flex h-9 items-center gap-1 rounded-full border px-3.5 text-[14px] font-semibold ${
                openOnly ? "border-grey-900 bg-grey-900 text-white" : "border-grey-200 bg-white text-grey-700"
              }`}
            >
              {openOnly && <Check size={14} strokeWidth={3} />}
              신청 가능만
            </button>
          </div>

          {/* 목록 */}
          <div className="mt-5 flex items-center justify-between px-1 pb-2">
            <p className="text-[13px] text-grey-500">{list.length}개 강좌</p>
            {filtered && (
              <button
                onClick={() => {
                  setQ("");
                  setGrades([]);
                  setDays([]);
                  setOpenOnly(false);
                }}
                className="text-[13px] text-grey-500"
              >
                필터 초기화
              </button>
            )}
          </div>
          {list.length === 0 ? (
            <p className="rounded-3xl bg-white py-10 text-center text-[15px] text-grey-500">조건에 맞는 강좌가 없어요.</p>
          ) : (
            <ul className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
              {list.map((c) => {
                const full = c.count >= c.capacity;
                const left = c.capacity - c.count;
                return (
                  <li key={c.id}>
                    <Link href={`/classes/${c.id}`} onClick={markBack} className="flex items-center gap-3 px-5 py-4 active:bg-grey-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${full ? "bg-grey-100 text-grey-400" : "bg-grey-100 text-grey-700"}`}>
                            {GRADE_LABEL[c.target_grade]}
                          </span>
                          <span className="rounded-md bg-grey-100 px-1.5 py-0.5 text-[11px] font-semibold text-grey-700">{c.level}</span>
                          {c.myKids.length > 0 && (
                            <span className="rounded-md bg-brand-weak px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                              {c.myKids.map((n) => n.slice(1)).join("·")} 수강 중
                            </span>
                          )}
                          {/* 최근 레벨테스트 판정과 같은 레벨 (다니는 아이는 빼고) */}
                          {c.levelKids.filter((n) => !c.myKids.includes(n)).length > 0 && (
                            <span className="rounded-md bg-success-weak px-1.5 py-0.5 text-[11px] font-semibold text-success">
                              {c.levelKids.filter((n) => !c.myKids.includes(n)).map((n) => n.slice(1)).join("·")} 레벨
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className={`text-[16px] font-bold ${full ? "text-grey-400" : ""}`}>{c.name}</span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-grey-500">
                          {c.schedules.map((s) => WEEKDAY[s.weekday]).join("·")} {c.schedules[0]?.start_time}~{c.schedules[0]?.end_time} · {c.teacherName}
                        </p>
                        <p className="tabular mt-0.5 text-[13px]">
                          <span className="text-grey-700">월 {won(c.monthly_fee)}</span>
                          <span className="text-grey-400"> · </span>
                          <span className={full ? "text-grey-400" : left <= 2 ? "font-semibold text-warning" : "text-grey-700"}>{full ? "마감" : `${left}자리 남음`}</span>
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-grey-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <div className="animate-fade absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="animate-sheet relative w-full max-w-[420px] rounded-t-3xl bg-white pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <h3 className="text-[20px] font-bold">필터</h3>
              <button aria-label="닫기" onClick={() => setSheet(false)} className="-mr-2 grid size-10 place-items-center text-grey-500">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 px-6 pt-2 pb-6">
              {(
                [
                  ["학년", "grades", gradeOpts, (r: Row, v: number) => r.target_grade === v],
                  ["요일", "days", dayOpts, (r: Row, v: number) => r.schedules.some((x) => x.weekday === v)],
                ] as const
              ).map(([title, key, opts, has]) => (
                <section key={key}>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <p className="text-[15px] font-bold">{title}</p>
                    <p className="text-[12px] text-grey-500">여러 개 선택 가능</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {opts.map((o) => (
                      <Chip
                        key={o.value}
                        on={draft[key].includes(o.value)}
                        count={(rows ?? []).filter((r) => has(r, o.value)).length}
                        onClick={() => setDraft({ ...draft, [key]: toggle(draft[key], o.value) })}
                      >
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="flex gap-2 border-t border-grey-100 px-4 pt-3">
              <button
                onClick={() => setDraft({ grades: [], days: [] })}
                disabled={draft.grades.length + draft.days.length === 0}
                className="flex h-14 items-center gap-1.5 rounded-2xl px-4 text-[15px] font-semibold text-grey-700 active:bg-grey-100 disabled:text-grey-400"
              >
                <RotateCcw size={17} /> 초기화
              </button>
              <button
                disabled={draftCount === 0}
                onClick={() => {
                  setGrades(draft.grades);
                  setDays(draft.days);
                  setSheet(false);
                }}
                className="h-14 flex-1 rounded-2xl bg-brand text-[17px] font-semibold text-white active:brightness-90 disabled:bg-grey-200 disabled:text-grey-500"
              >
                {draftCount === 0 ? "맞는 강좌가 없어요" : `${draftCount}개 강좌 보기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
