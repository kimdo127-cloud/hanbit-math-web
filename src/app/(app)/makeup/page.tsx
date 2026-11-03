"use client";
// 보강(하위 화면, 홈·출결에서 진입): 결석 1건마다 보강 1회. 결석 카드(신청 기간 표시) → 달력에서 가능한 날 → 수업 선택 (사례: 바디코디 수업 예약)
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DotLegend, MonthCalendar } from "@/components/calendar";
import { ChildTabs, useFamily } from "@/components/family";
import { Badge, BottomSheet, Button, Card, Dialog, Loader, Toast, TopBar, fmtDate } from "@/components/ui";
import { ApiError, cancelMakeup, getMakeups, requestMakeup, type AbsenceMakeup } from "@/lib/api";

const STATE: Record<AbsenceMakeup["state"], { label: string; tone: "brand" | "success" | "warning" | "grey" | "danger" }> = {
  available: { label: "신청 가능", tone: "warning" },
  booked: { label: "신청함", tone: "brand" },
  done: { label: "보강 완료", tone: "success" },
  full: { label: "자리 없음", tone: "grey" },
  expired: { label: "기간 지남", tone: "grey" },
};

function MakeupInner() {
  const { childId } = useFamily();
  const focus = Number(useSearchParams().get("absence")) || null;
  const [list, setList] = useState<AbsenceMakeup[] | null>(null);
  const [pick, setPick] = useState<AbsenceMakeup | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null); // 고른 보강 수업 (신청하기로 확정)
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!childId) return;
    getMakeups(childId).then((l) => {
      setList(l);
      // 출결 화면에서 결석을 눌러 들어오면 그 결석의 신청 화면을 바로 연다
      const f = focus && l.find((x) => x.attendanceId === focus && x.state === "available");
      if (f) open(f);
    });
  }, [childId, focus]);
  useEffect(load, [load]);

  function open(a: AbsenceMakeup) {
    setPick(a);
    setDay(a.slots[0]?.date ?? null);
    setSlot(null);
  }

  const book = async (sessionId: number, label: string) => {
    if (!pick) return;
    try {
      await requestMakeup(pick.attendanceId, sessionId);
      setPick(null);
      setToast(`${label} 보강을 신청했어요`);
      load();
    } catch (e) {
      setPick(null);
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  const cancel = async (id: number) => {
    try {
      await cancelMakeup(id);
      setToast("보강 신청을 취소했어요");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  const open_ = (list?.filter((a) => a.state === "available" || a.state === "booked") ?? []).sort((x, y) => x.date.localeCompare(y.date)); // 오래된 결석부터
  const past = list?.filter((a) => !(a.state === "available" || a.state === "booked")) ?? [];
  const dots = Object.fromEntries((pick?.slots ?? []).map((s) => [s.date, ["available" as const]]));
  const daySlots = pick?.slots.filter((s) => s.date === day) ?? [];

  return (
    <main>
      <TopBar back title="보강" />
      <ChildTabs />
      {!list ? (
        <Loader />
      ) : (
        <div className="space-y-3 px-4 pt-1">
          <p className="px-1 text-[13px] leading-relaxed text-grey-500">
            결석한 수업마다 보강을 1번 신청할 수 있어요. 결석한 달 안에서, 같은 학년 다른 강좌 수업 중 자리가 남은 날만 고를 수 있어요.
          </p>
          {open_.length === 0 && <Card className="text-center text-[15px] text-grey-700">지금 신청할 보강이 없어요.</Card>}
          {open_.map((a) => (
            <Card key={a.attendanceId}>
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold">
                  {fmtDate(a.date)} <span className="font-normal text-grey-500">{a.className} 결석</span>
                </p>
                <Badge tone={STATE[a.state].tone}>{STATE[a.state].label}</Badge>
              </div>
              {a.state === "available" ? (
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-[13px] text-grey-500">
                    {fmtDate(a.deadline)}까지 · 가능한 수업 {a.slots.length}개
                  </p>
                  <Button size="s" onClick={() => open(a)}>
                    신청
                  </Button>
                </div>
              ) : (
                a.booked && (
                  <div className="mt-3 flex items-center justify-between rounded-m bg-brand-weak px-4 py-3">
                    <span className="text-[14px]">
                      <b>{fmtDate(a.booked.date)}</b> {a.booked.className} · {a.booked.time}
                    </span>
                    <Button variant="ghost" size="s" onClick={() => cancel(a.booked!.makeupId)}>
                      취소
                    </Button>
                  </div>
                )
              )}
            </Card>
          ))}
          {past.length > 0 && (
            <>
              <h3 className="px-1 pt-3 text-[14px] font-semibold text-grey-500">지난 결석</h3>
              <ul className="divide-y divide-grey-200 overflow-hidden rounded-3xl bg-white">
                {past.map((a) => (
                  <li key={a.attendanceId} className="flex items-center gap-2 px-5 py-3.5">
                    <span className="flex-1 text-[14px]">
                      {fmtDate(a.date)} <span className="text-grey-500">{a.className}</span>
                      {a.booked && <span className="block text-[12px] text-brand">보강 · {fmtDate(a.booked.date)} {a.booked.className}</span>}
                    </span>
                    <Badge tone={STATE[a.state].tone}>{STATE[a.state].label}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <BottomSheet open={!!pick} onClose={() => setPick(null)} title="보강 수업 고르기">
        {pick && (
          <>
            <p className="-mt-2 mb-3 text-[13px] text-grey-500">
              {fmtDate(pick.date)} {pick.className} 결석분 · {fmtDate(pick.deadline)}까지
            </p>
            <MonthCalendar
              month={pick.deadline.slice(0, 7)}
              dots={dots}
              selected={day}
              onSelect={(d) => {
                setDay(d);
                setSlot(null);
              }}
            />
            <div className="mt-2">
              <DotLegend items={["available"]} />
            </div>
            <ul className="mt-4 space-y-2">
              {daySlots.map((s) => (
                <li key={s.sessionId}>
                  <button
                    onClick={() => setSlot(s.sessionId)}
                    aria-pressed={slot === s.sessionId}
                    className={`flex w-full items-center justify-between rounded-m border px-4 py-3 text-left ${slot === s.sessionId ? "border-brand bg-brand-weak" : "border-grey-200 active:bg-grey-50"}`}
                  >
                    <span>
                      <b className="text-[15px]">{s.className}</b>
                      <span className="ml-2 text-[13px] text-grey-500">{s.time}</span>
                    </span>
                    <Badge tone={s.left <= 2 ? "warning" : "brand"}>{s.left}자리 남음</Badge>
                  </button>
                </li>
              ))}
              {day && daySlots.length === 0 && <li className="text-[13px] text-grey-500">이날은 들어갈 수 있는 수업이 없어요.</li>}
            </ul>
            {(() => {
              const chosen = pick.slots.find((x) => x.sessionId === slot);
              return (
                <Button size="xl" className="mt-5 w-full" disabled={!chosen} onClick={() => chosen && book(chosen.sessionId, `${fmtDate(chosen.date)} ${chosen.className}`)}>
                  {chosen ? `${fmtDate(chosen.date)} ${chosen.className} 신청하기` : "보강 수업을 골라 주세요"}
                </Button>
              );
            })()}
          </>
        )}
      </BottomSheet>
      <Dialog open={!!error} title="신청할 수 없어요" body={error} primary="확인" onPrimary={() => setError(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

export default function MakeupPage() {
  return (
    <Suspense fallback={<Loader />}>
      <MakeupInner />
    </Suspense>
  );
}
