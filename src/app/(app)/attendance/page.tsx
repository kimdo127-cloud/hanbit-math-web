"use client";
// 캘린더: 지난 출결 + 신청한 보강 + 앞으로의 수업(예정) + 정기 레벨테스트(2월·8월). 결석일에서 바로 보강 신청으로 이동
// 헤더는 제목 없이 자녀 칩만 (어느 탭인지는 하단 탭이 알려 준다)
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DotLegend, MonthCalendar, type Dot } from "@/components/calendar";
import { ChildTabs, useFamily } from "@/components/family";
import { Badge, Card, Loader, MonthNav, fmtDate, markBack } from "@/components/ui";
import { getAttendance, getLevelTestDates, getMakeups, getPlanned, type AbsenceMakeup } from "@/lib/api";
import { currentMonth, shiftMonth } from "@/lib/calc";
import type { AttendanceStatus } from "@/lib/types";

const STATUS: Record<AttendanceStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  present: { label: "출석", tone: "success" },
  late: { label: "지각", tone: "warning" },
  absent: { label: "결석", tone: "danger" },
};

export default function AttendancePage() {
  const { childId } = useFamily();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<Awaited<ReturnType<typeof getAttendance>> | null>(null);
  const [mk, setMk] = useState<AbsenceMakeup[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [planned, setPlanned] = useState<Awaited<ReturnType<typeof getPlanned>>>([]);
  const [testDates, setTestDates] = useState<string[]>([]);

  useEffect(() => {
    if (!childId) return;
    setData(null);
    setSel(null);
    getAttendance(childId, month).then((d) => {
      setData(d);
      setSel(d.rows[0]?.date ?? null); // 가장 최근 수업일을 먼저 보여 준다
    });
    getMakeups(childId).then(setMk);
    getPlanned(childId, month).then(setPlanned);
    getLevelTestDates(month).then(setTestDates).catch(() => setTestDates([]));
  }, [childId, month]);

  const dots: Record<string, Dot[]> = {};
  data?.rows.forEach((r) => (dots[r.date] = [...(dots[r.date] ?? []), r.status]));
  data?.rows.forEach((r) => r.makeup && (dots[r.makeup.date] = [...(dots[r.makeup.date] ?? []), "makeup"]));
  planned.forEach((p) => (dots[p.date] = [...(dots[p.date] ?? []), "planned"]));
  testDates.forEach((d) => (dots[d] = [...(dots[d] ?? []), "leveltest"]));
  const dayPlanned = planned.filter((p) => p.date === sel);
  const dayRows = data?.rows.filter((r) => r.date === sel) ?? [];
  const dayMakeups = data?.rows.filter((r) => r.makeup?.date === sel) ?? [];

  return (
    <main>
      <header className="sticky top-0 z-10 mb-3 bg-grey-100/95 pt-5 backdrop-blur">
        <ChildTabs />
      </header>
      {!data ? (
        <Loader />
      ) : (
        <div className="space-y-3 px-4 pt-1">
          <Card>
            <div className="-mx-2 -mt-1 flex items-center justify-between">
              <MonthNav month={month} onChange={(d) => setMonth(shiftMonth(month, d))} />
              <span className="tabular pr-2 text-[13px] text-grey-500">
                결석 <b className={data.summary.absent ? "text-grey-900" : "font-normal"}>{data.summary.absent}</b> · 지각{" "}
                <b className={data.summary.late ? "text-grey-900" : "font-normal"}>{data.summary.late}</b> · 출석 {data.summary.present}
              </span>
            </div>
            <div className="mt-3">
              <MonthCalendar month={month} dots={dots} selected={sel} onSelect={setSel} />
            </div>
            <div className="mt-3 border-t border-grey-100 pt-3">
              <DotLegend items={["present", "late", "absent", "makeup", "planned", ...(testDates.length ? (["leveltest"] as Dot[]) : [])]} />
            </div>
          </Card>

          {sel && (
            <Card>
              <h2 className="text-[15px] font-bold">{fmtDate(sel)}</h2>
              {testDates.includes(sel) && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold">정기 레벨테스트</p>
                    <p className="text-[13px] text-grey-500">결과로 새 학기 반을 정해요. 시간은 학원에서 안내해요</p>
                  </div>
                  <Badge>레벨테스트</Badge>
                </div>
              )}
              {dayRows.length === 0 && dayMakeups.length === 0 && dayPlanned.length === 0 && !testDates.includes(sel) && <p className="mt-2 text-[14px] text-grey-500">이날은 수업이 없어요.</p>}
              {dayRows.map((r) => {
                const m = mk.find((x) => x.attendanceId === r.attendanceId);
                return (
                  <div key={r.attendanceId} className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">{r.className}</p>
                      <p className="tabular text-[13px] text-grey-500">
                        {r.startTime} 시작{r.checkedAt && ` · ${r.checkedAt} 등원`}
                        {r.status === "late" && <span className="text-warning"> · {r.lateMin}분 늦음</span>}
                      </p>
                      {r.topic && <p className="text-[13px] text-grey-700">수업 내용 · {r.topic}</p>}
                      {r.makeup && <p className="text-[12px] text-brand">보강 · {fmtDate(r.makeup.date)} {r.makeup.className}</p>}
                    </div>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    {m?.state === "available" && (
                      <Link
                        href={`/makeup?absence=${m.attendanceId}`}
                        onClick={markBack}
                        className="rounded-[10px] bg-brand px-3 py-1.5 text-[13px] font-semibold text-white"
                      >
                        보강 신청
                      </Link>
                    )}
                  </div>
                );
              })}
              {dayMakeups.map((r) => (
                <div key={"m" + r.attendanceId} className="mt-3 flex items-center gap-3">
                  <p className="flex-1 text-[15px] font-semibold">
                    {r.makeup!.className} <span className="text-[12px] font-normal text-grey-500">({fmtDate(r.date)} 결석분)</span>
                  </p>
                  <Badge tone="brand">보강</Badge>
                </div>
              ))}
              {dayPlanned.map((p) => (
                <div key={"p" + p.className} className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold">{p.className}</p>
                    <p className="tabular text-[13px] text-grey-500">{p.time}</p>
                    {p.topic && <p className="text-[13px] text-grey-700">예정 진도 · {p.topic}</p>}
                  </div>
                  <Badge>예정</Badge>
                </div>
              ))}
            </Card>
          )}

          <Link href="/makeup" onClick={markBack} className="flex items-center justify-between rounded-3xl bg-white px-5 py-4 text-[15px] font-semibold">
            보강 신청 · 내역
            <ChevronRight size={18} className="text-grey-400" />
          </Link>
        </div>
      )}
    </main>
  );
}
