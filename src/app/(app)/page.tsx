"use client";
// 홈 = 가족 전체를 한눈에 (사례: 세이프 출석기·체키 — 여러 자녀 출결을 한 화면, 등원 시각 강조)
// 토스 홈 원칙: 자주 보는 것만, 할 일이 있을 때만 노출, 강조 버튼은 하나(보강 신청)
// 순서: 미납(있을 때만) → 오늘 수업 → 이번 달 출결(+아이별 보강) → 이번 주 수업. 보강 신청이 밀리지 않게 출결을 위로
import { AlertCircle, ChevronRight, Sigma } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { Loader, TopBar, WEEKDAY, fmtDate, markBack, won } from "@/components/ui";
import { getChildHome, getFamilyUnpaid, getFamilyWeek, getMakeups, today, type AbsenceMakeup } from "@/lib/api";
import { currentMonth, toMin } from "@/lib/calc";

type Home = Awaited<ReturnType<typeof getChildHome>>;
type Kid = { home: Home; makeups: AbsenceMakeup[] };
type Week = Awaited<ReturnType<typeof getFamilyWeek>>;

// 아이마다 고정 색: 연한 바탕 + 같은 계열 진한 글자 (눈이 편한 톤)
const KID = [
  { bg: "#e8f3ff", fg: "#2272eb" },
  { bg: "#f0ecfb", fg: "#6e5bc4" },
  { bg: "#e7f4f0", fg: "#2a8a72" },
  { bg: "#fbf0e6", fg: "#b26a2e" },
];
// 출결 막대: 출석은 차분하게, 지각·결석만 색을 남긴다
const BAR = { present: "#d6dde6", late: "#fdc37a", absent: "#f7a0a0" };
const STATUS = {
  present: { label: "출석", color: "#3a9b6a" },
  late: { label: "지각", color: "#d9822b" },
  absent: { label: "결석", color: "#e05a5a" },
} as const;

const short = (name: string) => name.slice(1);
const mmdd = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;
const wd = (d: string) => WEEKDAY[new Date(d + "T00:00:00").getDay()];

function Avatar({ name, idx, size = 28 }: { name: string; idx: number; size?: number }) {
  const c = KID[idx % KID.length];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold"
      style={{ width: size, height: size, fontSize: size * 0.46, background: c.bg, color: c.fg }}
    >
      {name.slice(1, 2)}
    </span>
  );
}

function TodayCard({ h, idx, onOpen }: { h: Home; idx: number; onOpen: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const t = h.today[0];
  const st = h.isToday && t?.status ? STATUS[t.status] : null;
  return (
    <Link href={t ? "/attendance" : "/classes"} onClick={onOpen} className="flex min-w-0 flex-col rounded-3xl bg-white p-4 active:bg-grey-50">
      <div className="flex items-center gap-2">
        <Avatar name={h.student.name} idx={idx} />
        <span className="flex-1 truncate text-[15px] font-bold">{short(h.student.name)}</span>
        {st && (
          <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: st.color }}>
            <span className="size-1.5 rounded-full" style={{ background: st.color }} />
            {st.label}
          </span>
        )}
        {h.isToday && t && !t.status && <span className="text-[13px] font-semibold text-grey-500">등원 전</span>}
      </div>

      {!t ? (
        <p className="mt-4 text-[14px] text-grey-500">
          다니는 강좌가 없어요
          <span className="mt-1 block font-semibold text-brand">수강 신청하기 ›</span>
        </p>
      ) : h.isToday ? (
        <>
          <p className="tabular mt-4 text-[28px] leading-none font-bold">{t.checkedAt ?? "--:--"}</p>
          <p className="mt-1 text-[13px] text-grey-700">
            {t.status === "absent" ? "등원하지 않았어요" : t.status === "late" ? `등원 · ${toMin(t.checkedAt!) - toMin(t.start)}분 늦음` : t.checkedAt ? "등원" : "아직 등원 전이에요"}
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-[17px] leading-tight font-bold text-grey-400">오늘 수업 없음</p>
          <p className="mt-1 text-[13px] text-grey-700">
            다음 {mmdd(t.date)}({wd(t.date)})
          </p>
        </>
      )}

      {t && (
        <div className="mt-3 border-t border-grey-100 pt-3">
          <p className="tabular truncate text-[13px] font-semibold">
            {t.className} <span className="font-normal text-grey-500">{t.start}</span>
          </p>
          {t.topic && <p className="mt-0.5 truncate text-[12px] text-grey-500">{h.isToday ? t.topic : `예정 · ${t.topic}`}</p>}
        </div>
      )}
    </Link>
  );
}

export default function HomePage() {
  const { children, setChildId } = useFamily();
  const [kids, setKids] = useState<Kid[] | null>(null);
  const [week, setWeek] = useState<Week | null>(null);
  const [unpaid, setUnpaid] = useState<Awaited<ReturnType<typeof getFamilyUnpaid>> | null>(null);

  useEffect(() => {
    Promise.all(children.map(async (c) => ({ home: await getChildHome(c.id), makeups: await getMakeups(c.id) }))).then(setKids);
    getFamilyWeek().then(setWeek);
    getFamilyUnpaid().then(setUnpaid);
  }, [children]);

  const go = (studentId: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    setChildId(studentId);
    markBack(e);
  };
  const idxOf = (studentId: number) => Math.max(0, kids?.findIndex((k) => k.home.student.id === studentId) ?? 0);
  const nameOf = (studentId: number) => short(kids?.find((k) => k.home.student.id === studentId)?.home.student.name ?? "");
  const now = today();
  const rest = week?.items.filter((i) => i.date > now) ?? [];

  return (
    <main>
      <TopBar
        title={
          <span className="flex items-center gap-2 text-[20px] font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-brand text-white">
              <Sigma size={17} strokeWidth={2.6} />
            </span>
            한빛수학
          </span>
        }
      />
      {!kids || !week ? (
        <Loader />
      ) : (
        <div className="space-y-7 px-4 pt-1">
          {unpaid && unpaid.total > 0 && (
            <Link href="/payments" onClick={markBack} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5">
              <AlertCircle size={18} className="shrink-0 text-danger" />
              <span className="flex-1 text-[14px] text-grey-700">
                <b className="text-grey-900">{unpaid.items.join(", ")}</b> 수강료 <b className="tabular text-danger">{won(unpaid.total)}</b> 미납
              </span>
              <ChevronRight size={18} className="text-grey-400" />
            </Link>
          )}

          <section>
            <div className="flex items-baseline justify-between px-1 pb-2.5">
              <h2 className="text-[17px] font-bold">오늘 수업</h2>
              <span className="text-[13px] text-grey-500">{fmtDate(now)}</span>
            </div>
            <div className={`grid gap-3 ${kids.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {kids.map((k, i) => (
                <TodayCard key={k.home.student.id} h={k.home} idx={i} onOpen={go(k.home.student.id)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="px-1 pb-2.5 text-[17px] font-bold">{Number(currentMonth().slice(5))}월 출결</h2>
            <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
              {kids.map(({ home: h, makeups }, i) => {
                const a = h.attendance;
                const avail = makeups.filter((m) => m.state === "available").sort((x, y) => x.date.localeCompare(y.date));
                const booked = makeups.filter((m) => m.state === "booked" && m.booked);
                const pct = (n: number) => (a.total ? `${(n / a.total) * 100}%` : "0%");
                return (
                  <div key={h.student.id} className="px-4 py-4">
                    <Link href="/attendance" onClick={go(h.student.id)} className="flex items-center gap-3">
                      <Avatar name={h.student.name} idx={i} />
                      <div className="min-w-0 flex-1">
                        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-grey-100">
                          {a.present > 0 && <span className="rounded-full" style={{ width: pct(a.present), background: BAR.present }} />}
                          {a.late > 0 && <span className="rounded-full" style={{ width: pct(a.late), background: BAR.late }} />}
                          {a.absent > 0 && <span className="rounded-full" style={{ width: pct(a.absent), background: BAR.absent }} />}
                        </div>
                        <p className="tabular mt-1.5 text-[13px] text-grey-500">
                          {a.total === 0 ? (
                            "기록 없음"
                          ) : (
                            <>
                              결석 <b className={a.absent ? "text-grey-900" : "font-normal"}>{a.absent}</b> · 지각{" "}
                              <b className={a.late ? "text-grey-900" : "font-normal"}>{a.late}</b> · 출석 {a.present}
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-grey-400" />
                    </Link>

                    {avail.length > 0 && (
                      <div className="mt-3 ml-10 flex items-center gap-3 rounded-2xl bg-grey-50 px-3.5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">보강 신청할 수 있어요</p>
                          <p className="mt-0.5 text-[12px] text-grey-500">
                            {avail.map((m) => mmdd(m.date)).join(", ")} 결석분 · {mmdd(avail[0].deadline)}까지
                          </p>
                        </div>
                        <Link href="/makeup" onClick={go(h.student.id)} className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-semibold text-white">
                          신청
                        </Link>
                      </div>
                    )}
                    {booked.map((m) => (
                      <p key={m.attendanceId} className="tabular mt-2 ml-10 text-[13px] text-grey-700">
                        <span className="mr-1.5 rounded-md bg-brand-weak px-1.5 py-0.5 text-[11px] font-semibold text-brand">보강 예정</span>
                        {mmdd(m.booked!.date)}({wd(m.booked!.date)}) {m.booked!.className} {m.booked!.time.split("~")[0]}
                      </p>
                    ))}
                  </div>
                );
              })}
            </div>
            {kids.some((k) => k.home.attendance.late >= 3) && <p className="px-2 pt-2 text-[12px] text-grey-500">지각 3번은 결석 1번으로 계산돼요.</p>}
          </section>

          <section>
            <h2 className="px-1 pb-2.5 text-[17px] font-bold">이번 주 수업</h2>
            <div className="rounded-3xl bg-white p-4">
              <div className="grid grid-cols-7 text-center">
                {week.days.map((d) => {
                  const day = week.items.filter((i) => i.date === d);
                  const isToday = d === now;
                  const past = d < now;
                  return (
                    <div key={d} className={past ? "opacity-40" : ""}>
                      <p className={`text-[12px] ${isToday ? "font-bold text-brand" : "text-grey-500"}`}>{wd(d)}</p>
                      <p
                        className={`mx-auto mt-1 grid size-8 place-items-center rounded-full text-[14px] font-semibold ${isToday ? "bg-grey-900 text-white" : ""}`}
                      >
                        {Number(d.slice(8))}
                      </p>
                      <div className="mt-1 flex h-2 justify-center gap-0.5">
                        {[...new Set(day.map((i) => i.studentId))].map((sid) => (
                          <span key={sid} className="size-1.5 rounded-full" style={{ background: KID[idxOf(sid) % KID.length].fg }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ul className="mt-3 space-y-2 border-t border-grey-100 pt-3">
                {rest.length === 0 && <li className="text-[13px] text-grey-500">이번 주 남은 수업이 없어요</li>}
                {rest.map((i) => (
                  <li key={i.date + i.studentId + i.className} className="tabular flex items-center gap-2 text-[14px]">
                    <span className="w-14 shrink-0 text-grey-500">
                      {mmdd(i.date)}({wd(i.date)})
                    </span>
                    <Avatar name={"_" + nameOf(i.studentId)} idx={idxOf(i.studentId)} size={20} />
                    <span className="flex-1 truncate">
                      {i.className} <span className="text-grey-500">{i.time.split("~")[0]}</span>
                    </span>
                    {i.makeup && <span className="rounded-md bg-brand-weak px-1.5 py-0.5 text-[11px] font-semibold text-brand">보강</span>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
