"use client";
// 강좌 상세 (하단 탭 숨김): 요약 → 수업 정보 → 강좌 소개 → 진도 계획 → 수강료 → 환불·보강 규정 → [수강 신청]
// 사례: 어학원 강좌 안내(수강료·교재비·정원·규정을 한 페이지에), 학원법 시행령 별표4 환불 기준
// 신청 규칙: 이미 다니는 자녀, 대상 학년이 아닌 자녀는 고를 수 없음 (선행·복습은 상담·레벨 테스트 후 학원이 등록 → 누르면 안내). 쌍둥이 등 여러 명 동시 신청 가능
import { Check } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BottomSheet, Button, Dialog, Loader, Toast, TopBar, WEEKDAY, fmtDate, won } from "@/components/ui";
import { ACADEMY_PHONE, ApiError, enrollMany, getClassDetail, GRADE_LABEL } from "@/lib/api";

type Detail = Awaited<ReturnType<typeof getClassDetail>>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-1 pb-2.5 text-[17px] font-bold">{title}</h2>
      <div className="overflow-hidden rounded-3xl bg-white">{children}</div>
    </section>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-3.5 text-[15px]">
      <span className="shrink-0 text-grey-500">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

export default function ClassDetailPage() {
  const id = Number(useParams().id);
  const [d, setD] = useState<Detail | null>(null);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [advance, setAdvance] = useState<string | null>(null); // 선행 안내

  const load = useCallback(() => {
    getClassDetail(id).then(setD);
  }, [id]);
  useEffect(load, [load]);

  if (!d) return <Loader />;
  const c = d.cls;
  const left = c.capacity - c.count;
  const full = left <= 0;
  const selectable = d.kids.filter((k) => !k.enrolled && !k.gradeDiff);
  const advanceMsg = (names: string) => `${names} 학생은 ${GRADE_LABEL[c.target_grade]} 대상이 아니라 앱에서 신청할 수 없어요. 선행 수강은 학원 상담과 레벨 테스트 후에 등록해 드려요.\n한빛수학 ${ACADEMY_PHONE}`;
  const days = c.schedules.map((s) => WEEKDAY[s.weekday]).join("·");
  const perMonth = c.schedules.length * 4;
  const hours = c.schedules[0] ? (Number(c.schedules[0].end_time.slice(0, 2)) * 60 + Number(c.schedules[0].end_time.slice(3)) - (Number(c.schedules[0].start_time.slice(0, 2)) * 60 + Number(c.schedules[0].start_time.slice(3)))) / 60 : 0;
  const over = sel.length > left;

  const submit = async () => {
    setBusy(true);
    try {
      await enrollMany(sel, c.id);
      setOpen(false);
      setToast(`${d.kids.filter((k) => sel.includes(k.id)).map((k) => k.name).join(", ")} 학생 수강을 신청했어요`);
      load();
    } catch (e) {
      setOpen(false);
      setRejected(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="pb-28">
      <TopBar back title="강좌 정보" />
      <div className="space-y-7 px-4">
        {/* 요약 */}
        <section className="rounded-3xl bg-white p-5">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-brand-weak px-2 py-0.5 text-[12px] font-semibold text-brand">{GRADE_LABEL[c.target_grade]} 대상</span>
                        {d.kids.filter((k) => k.enrolled).map((k) => (
              <span key={k.id} className="rounded-md bg-grey-900 px-2 py-0.5 text-[12px] font-semibold text-white">
                {k.name.slice(1)} 수강 중
              </span>
            ))}
          </div>
          <h1 className="mt-3 text-[22px] font-bold">{c.name}</h1>
          <p className="tabular mt-1 text-[15px] text-grey-700">
            {days} {c.schedules[0]?.start_time}~{c.schedules[0]?.end_time} · {c.teacherName}
          </p>
          <p className="tabular mt-3 text-[14px]">
            <span className="text-grey-500">정원 {c.capacity}명 · </span>
            <span className={`font-semibold ${full ? "text-danger" : left <= 2 ? "text-warning" : "text-brand"}`}>{full ? "마감" : `${left}자리 남음`}</span>
          </p>
        </section>

        <Section title="수업 정보">
          <div className="divide-y divide-grey-100">
            <Item k="요일·시간" v={`${days} ${c.schedules[0]?.start_time}~${c.schedules[0]?.end_time}`} />
            <Item k="수업 시간" v={`회당 ${hours}시간 · 주 ${c.schedules.length}회`} />
            <Item k="한 달 수업" v={`약 ${perMonth}회`} />
            <Item k="선생님" v={c.teacherName} />
            <Item k="교재" v={c.textbook} />
          </div>
        </Section>

        <Section title="강좌 소개">
          <p className="px-5 py-4 text-[15px] leading-relaxed text-grey-700">{c.description}</p>
        </Section>

        <Section title="진도 계획">
          <ul className="divide-y divide-grey-100">
            {d.plan.length === 0 && <li className="px-5 py-4 text-[14px] text-grey-500">예정된 수업이 없어요.</li>}
            {d.plan.map((p, i) => (
              <li key={p.date} className="tabular flex items-center gap-3 px-5 py-3 text-[14px]">
                <span className="w-10 shrink-0 text-[12px] font-semibold text-grey-400">{d.done + i + 1}회</span>
                <span className="w-24 shrink-0 text-grey-500">{fmtDate(p.date)}</span>
                <span className="flex-1">{p.topic ?? "-"}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-grey-100 px-5 py-3 text-[12px] text-grey-500">학교 시험 일정에 따라 진도가 바뀔 수 있어요.</p>
        </Section>

        <Section title="수강료">
          <div className="divide-y divide-grey-100">
            <Item k="월 수강료" v={<span className="tabular">{won(c.monthly_fee)}</span>} />
            <Item k="회당" v={<span className="tabular">약 {won(Math.round(c.monthly_fee / perMonth / 100) * 100)}</span>} />
            <Item k="형제 할인" v="둘째부터 10%" />
            <Item k="교재비" v="별도 (학원에서 안내)" />
            <Item k="첫 달" v="남은 수업 수만큼 (회차 기준)" />
            <Item k="납부" v="매월 학원에서 직접" />
          </div>
        </Section>

        <Section title="환불·보강 규정">
          <div className="space-y-3 px-5 py-4 text-[14px] text-grey-700">
            <div>
              <p className="font-semibold text-grey-900">수강 중단 시 환불 (학원법 기준)</p>
              <ul className="tabular mt-1.5 space-y-1">
                <li className="flex justify-between">
                  <span>수업 시작 전</span>
                  <span className="font-semibold">전액</span>
                </li>
                <li className="flex justify-between">
                  <span>한 달 수업의 1/3 지나기 전</span>
                  <span className="font-semibold">2/3</span>
                </li>
                <li className="flex justify-between">
                  <span>1/2 지나기 전</span>
                  <span className="font-semibold">1/2</span>
                </li>
                <li className="flex justify-between">
                  <span>1/2 지난 뒤</span>
                  <span className="font-semibold">환불 없음</span>
                </li>
              </ul>
              <p className="mt-1.5 text-[12px] text-grey-500">중단을 신청하면 5일 안에 돌려드려요.</p>
            </div>
            <div className="border-t border-grey-100 pt-3">
              <p className="font-semibold text-grey-900">보강</p>
              <p className="mt-1">결석한 수업마다 1번, 같은 달 안에 같은 학년 다른 강좌 수업으로 들을 수 있어요.</p>
            </div>
          </div>
        </Section>
      </div>

      {/* 하단 고정 신청 버튼 (하단 탭 없음) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[420px] bg-gradient-to-t from-grey-100 via-grey-100 to-transparent px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <Button
          size="xl"
          className="w-full"
          disabled={full || d.kids.every((k) => k.enrolled)}
          onClick={() => {
            // 신청할 수 있는 자녀가 없고 학년이 다른 자녀만 있으면 → 선행 안내
            if (selectable.length === 0) return setAdvance(advanceMsg(d.kids.filter((k) => !k.enrolled).map((k) => k.name).join(", ")));
            setSel(selectable.length === 1 ? [selectable[0].id] : []);
            setOpen(true);
          }}
        >
          {full ? "정원이 다 찼어요" : d.kids.every((k) => k.enrolled) ? "모든 자녀가 수강 중이에요" : "수강 신청"}
        </Button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={`${c.name} 신청`}>
        <p className="mb-2 text-[13px] font-semibold text-grey-700">수강할 자녀 (여러 명 선택 가능)</p>
        <div className="space-y-2">
          {d.kids.map((k) => {
            const on = sel.includes(k.id);
            return (
              <button
                key={k.id}
                disabled={k.enrolled}
                onClick={() => (k.gradeDiff ? setAdvance(advanceMsg(k.name)) : setSel(on ? sel.filter((x) => x !== k.id) : [...sel, k.id]))}
                className={`flex w-full items-center gap-3 rounded-m border px-4 py-3 text-left ${on ? "border-brand bg-brand-weak" : "border-grey-200"} ${k.gradeDiff ? "bg-grey-50" : ""} disabled:bg-grey-50`}
              >
                <span className={`grid size-5 place-items-center rounded-full border ${on ? "border-brand bg-brand text-white" : "border-grey-400"} ${k.enrolled || k.gradeDiff ? "opacity-0" : ""}`}>
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[15px] font-semibold ${k.enrolled || k.gradeDiff ? "text-grey-400" : ""}`}>
                  {k.name} <span className="ml-1 text-[13px] font-normal text-grey-500">{GRADE_LABEL[k.grade as keyof typeof GRADE_LABEL]}</span>
                </span>
                {k.enrolled ? (
                  <span className="text-[12px] font-semibold text-grey-400">수강 중 · 신청 불가</span>
                ) : (
                  k.gradeDiff && <span className="text-[12px] font-semibold text-grey-500">선행 · 상담 후 등록 ›</span>
                )}
              </button>
            );
          })}
        </div>
        {over && <p className="mt-3 text-[13px] text-danger">남은 자리가 {left}개예요. 신청할 자녀 수를 줄여 주세요.</p>}
        {d.firstDate && (
          <div className="mt-4 flex items-center justify-between rounded-m bg-grey-50 px-4 py-3 text-[14px]">
            <span className="text-grey-700">첫 수업</span>
            <span className="font-semibold">
              {fmtDate(d.firstDate)} {c.schedules[0]?.start_time}
            </span>
          </div>
        )}
        <p className="mt-2 px-1 text-[12px] text-grey-500">학원 시간표에 따라 가장 가까운 수업일부터 시작해요. 첫 달 수강료는 남은 수업 수만큼만 내요.</p>
        <Button size="xl" className="mt-6 w-full" disabled={busy || sel.length === 0 || over} onClick={submit}>
          {busy ? "신청 중…" : sel.length > 1 ? `${sel.length}명 신청하기` : "신청하기"}
        </Button>
      </BottomSheet>
      <Dialog open={!!rejected} title="신청할 수 없어요" body={rejected} primary="확인" onPrimary={() => setRejected(null)} />
      <Dialog open={!!advance} title="선행 수강은 상담 후 등록해요" body={advance} primary="확인" onPrimary={() => setAdvance(null)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
