"use client";
// MY > 자녀 상세: 기본 정보 · 레벨테스트 · 다니는 강좌(수강 중단). 연락처는 가족 공통이라 MY › 보호자 연락처에서만
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { BottomSheet, Button, Loader, TextField, Toast, TopBar, WEEKDAY, fmtDate, markBack, won } from "@/components/ui";
import { ApiError, getLevelTests, getWithdrawInfo, GRADE_LABEL, listEnrollments, today, updateChild, withdraw, type LevelTestView } from "@/lib/api";
import type { Grade } from "@/lib/types";

export default function ChildPage() {
  const id = Number(useParams().id);
  const { children, reload } = useFamily();
  const c = children.find((x) => x.id === id);
  const [enr, setEnr] = useState<Awaited<ReturnType<typeof listEnrollments>> | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", school: "", grade: 7 as Grade, birth_date: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  type Enr = Awaited<ReturnType<typeof listEnrollments>>[number];
  const [target, setTarget] = useState<Enr | null>(null);
  const [endDate, setEndDate] = useState(today());
  const [wErr, setWErr] = useState("");
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getWithdrawInfo>> | null>(null);

  const [lv, setLv] = useState<Awaited<ReturnType<typeof getLevelTests>> | null>(null);
  const [openTest, setOpenTest] = useState<LevelTestView | null>(null);
  // 정기·입학 결과의 바로 앞 결과 (변화 표시용). 선행 테스트는 비교하지 않음
  const prevOf = (t: LevelTestView) => (t.kind === "advance" ? null : (lv?.tests.find((x) => x.kind !== "advance" && x.tested_on < t.tested_on) ?? null));

  useEffect(() => {
    listEnrollments(id).then(setEnr);
    getLevelTests(id).then(setLv).catch(() => setLv(null));
  }, [id]);

  // 수강 중단 전에 남은 수업 · 보강 기회 · 예상 환불 금액을 보여 준다
  useEffect(() => {
    if (!target || !endDate) return;
    getWithdrawInfo(target.id, endDate).then(setInfo).catch(() => setInfo(null));
  }, [target, endDate]);

  if (!c || !enr) return <Loader />;
  const active = enr.filter((e) => !e.end_date);
  const ended = enr.filter((e) => e.end_date);

  const doWithdraw = async () => {
    if (!target) return;
    setWErr("");
    try {
      await withdraw(target.id, endDate);
      setToast(`${target.cls.name} 수강을 중단했어요`);
      setTarget(null);
      listEnrollments(id).then(setEnr);
    } catch (e) {
      setWErr(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  const save = async () => {
    setError("");
    try {
      await updateChild(id, form);
      setOpen(false);
      await reload();
      setToast("자녀 정보를 고쳤어요");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  const Item = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex justify-between px-5 py-3.5 text-[15px]">
      <span className="text-grey-500">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );

  return (
    <main>
      <TopBar
        back
        title={c.name}
        right={
          <Button
            variant="ghost"
            size="s"
            onClick={() => {
              setForm({ name: c.name, school: c.school, grade: c.grade, birth_date: c.birth_date });
              setError("");
              setOpen(true);
            }}
          >
            수정
          </Button>
        }
      />
      <div className="space-y-4 px-4 pt-1">
        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">기본 정보</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            <Item k="학년" v={GRADE_LABEL[c.grade]} />
            <Item k="학교" v={c.school} />
            <Item k="생년월일" v={c.birth_date.replaceAll("-", ". ")} />
            <Item k="출석 번호" v={<span className="tabular">{c.kiosk_code}</span>} />
          </div>
        </section>

        {lv && (
          <section>
            <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">레벨테스트</h2>
            <div className="overflow-hidden rounded-3xl bg-white">
              {lv.latest ? (
                <div className="px-5 py-5">
                  <TestDetail t={lv.latest} prev={prevOf(lv.latest)} />
                  {(() => {
                    // 맞는 반: 신청 가능한 반 우선, 없으면 참고로 마감된 반
                    const r = lv.recommend.find((x) => x.seatsLeft > 0 && !x.overlap) ?? lv.recommend[0];
                    return r ? (
                      <Link href={`/classes/${r.classId}`} onClick={markBack} className="mt-4 flex items-center justify-between rounded-2xl bg-grey-50 px-4 py-3 active:bg-grey-100">
                        <span className="text-[14px]">
                          <span className="text-grey-500">맞는 반 </span>
                          <b>{r.name}</b>
                          <span className="text-grey-500">{r.seatsLeft === 0 ? " · 마감" : r.overlap ? " · 시간 겹침" : ` · ${r.seatsLeft}자리`}</span>
                        </span>
                        <ChevronRight size={18} className="text-grey-400" />
                      </Link>
                    ) : null;
                  })()}
                  {lv.canAdvance && <p className="mt-3 rounded-2xl bg-brand-weak px-4 py-3 text-[14px] text-brand">선행 테스트를 통과했어요. 선행반은 상담 후 학원에서 신청해요.</p>}
                </div>
              ) : (
                <p className="px-5 py-4 text-[15px] text-grey-500">아직 레벨테스트 기록이 없어요.</p>
              )}
              <p className="border-t border-grey-100 px-5 py-3 text-[13px] text-grey-500">다음 정기 테스트 {fmtDate(lv.nextRegular)}</p>
              {lv.tests
                .filter((t) => t.id !== lv.latest?.id)
                .map((t) => (
                  <button key={t.id} onClick={() => setOpenTest(t)} className="flex w-full items-center justify-between border-t border-grey-100 px-5 py-3 text-left text-[14px] active:bg-grey-50">
                    <span className="text-grey-700">
                      {fmtDate(t.tested_on)} · {t.kindLabel}
                    </span>
                    <span className="tabular flex items-center gap-1 font-semibold">
                      {t.kind === "advance" ? (t.advance_ok ? "선행 통과" : "선행 미통과") : t.result_level}
                      <ChevronRight size={16} className="text-grey-400" />
                    </span>
                  </button>
                ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">다니는 강좌</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            {active.length === 0 && <p className="px-5 py-4 text-[15px] text-grey-500">다니는 강좌가 없어요.</p>}
            {active.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{e.cls.name}</p>
                  <p className="text-[13px] text-grey-500">
                    {e.cls.schedules.map((s) => WEEKDAY[s.weekday]).join("·")} {e.cls.schedules[0]?.start_time}~{e.cls.schedules[0]?.end_time} · {e.cls.teacherName} · {fmtDate(e.start_date)}부터
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="s"
                  onClick={() => {
                    setTarget(e);
                    setEndDate(e.start_date > today() ? e.start_date : today());
                    setInfo(null);
                    setWErr("");
                  }}
                >
                  수강 중단
                </Button>
              </div>
            ))}
            {ended.map((e) => (
              <div key={e.id} className="px-5 py-3.5 opacity-60">
                <p className="text-[14px] font-semibold">
                  {e.cls.name} <span className="ml-1 text-[12px] font-normal text-grey-500">수강 중단</span>
                </p>
                <p className="text-[12px] text-grey-500">
                  {fmtDate(e.start_date)} ~ {fmtDate(e.end_date!)}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="자녀 정보 수정">
        <div className="space-y-3">
          <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {/* 학년은 다니는 강좌와 이어져 있어 학원만 바꾼다 (수정 화면에 넣지 않음) */}
          <TextField label="학교" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          <TextField label="생년월일" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          {error && <p className="text-[13px] text-danger">{error}</p>}
        </div>
        <Button size="xl" className="mt-6 w-full" onClick={save}>
          저장
        </Button>
      </BottomSheet>
      <BottomSheet open={!!target} onClose={() => setTarget(null)} title={`${target?.cls.name} 수강을 중단할까요?`}>
        <p className="mb-4 text-[15px] text-grey-700">중단하기 전에 확인해 주세요. 수강 기록은 지워지지 않아요.</p>
        <TextField label="수강 중단일 (이날부터 수업 없음)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={wErr || undefined} />
        {info && (
          <dl className="mt-4 space-y-2 rounded-m bg-grey-50 px-4 py-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-grey-700">이번 달 남은 수업</dt>
              <dd className="tabular font-semibold">
                {info.remaining}회 / {info.total}회
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-grey-700">남은 보강 기회</dt>
              <dd className="font-semibold">{info.makeupLeft ? "1회 (출결 화면에서 신청)" : "없음"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-grey-700">예상 환불 금액</dt>
              <dd className="tabular font-bold text-brand">{won(info.refund)}</dd>
            </div>
            <p className="text-[12px] text-grey-500">
              {info.paid ? `낸 금액 ${won(info.paid)} · ${info.rule} (학원법 기준)` : "이번 달 수강료를 아직 내지 않아 환불 금액이 없어요."} 환불은 학원에서 5일 안에 처리해요.
            </p>
          </dl>
        )}
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setTarget(null)}>
            닫기
          </Button>
          <Button variant="danger" className="flex-1" onClick={doWithdraw}>
            수강 중단
          </Button>
        </div>
      </BottomSheet>
      <BottomSheet open={!!openTest} onClose={() => setOpenTest(null)} title={openTest ? `${fmtDate(openTest.tested_on)} ${openTest.kindLabel} 테스트` : ""}>
        {openTest && <TestDetail t={openTest} prev={prevOf(openTest)} />}
      </BottomSheet>
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}

const LEVEL_MAX3 = { concept: 40, type: 40, advanced: 20 };
const AREAS = [
  ["수와 연산", "area_number"],
  ["변화와 관계", "area_change"],
  ["도형과 측정", "area_shape"],
  ["자료와 가능성", "area_data"],
] as const;

function Bar({ label, value, max, weak }: { label: string; value: number; max: number; weak?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className={`w-24 shrink-0 ${weak ? "font-semibold text-grey-900" : "text-grey-500"}`}>{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-grey-100">
        <span className={`block h-full rounded-full ${weak ? "bg-warning" : "bg-brand"}`} style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </span>
      <span className="tabular w-12 text-right text-grey-700">{max === 100 ? `${value}%` : `${value}/${max}`}</span>
    </div>
  );
}

// 결과 한 건: 판정을 크게 → 총점·변화 → 약한 분야 → 막대 → 선생님 코멘트
function TestDetail({ t, prev }: { t: LevelTestView; prev: LevelTestView | null }) {
  const areas = AREAS.map(([l, k]) => [l, t[k]] as const).filter((x): x is readonly [(typeof AREAS)[number][0], number] => x[1] !== null);
  const weak = areas.length ? [...areas].sort((a, b) => a[1] - b[1])[0][0] : null;
  const diff = prev ? t.total_score - prev.total_score : null;
  return (
    <div>
      <p className="text-[13px] text-grey-500">
        {fmtDate(t.tested_on)} · {t.kindLabel} 테스트
      </p>
      <p className="mt-1 text-[28px] leading-tight font-bold">{t.kind === "advance" ? (t.advance_ok ? "선행 통과" : "선행 미통과") : t.result_level}</p>
      <p className="tabular mt-0.5 text-[14px] text-grey-500">
        {t.total_score}점
        {diff !== null && <span className={diff > 0 ? "text-brand" : diff < 0 ? "text-warning" : ""}> · 지난번보다 {diff > 0 ? `+${diff}` : diff === 0 ? "같음" : diff}</span>}
      </p>
      {weak && <p className="mt-3 text-[15px] font-semibold">{weak}{(weak.charCodeAt(weak.length - 1) - 0xac00) % 28 ? "이" : "가"} 가장 약해요</p>}
      <div className="mt-3 space-y-2">
        <Bar label="개념" value={t.concept_score} max={LEVEL_MAX3.concept} />
        <Bar label="유형" value={t.type_score} max={LEVEL_MAX3.type} />
        <Bar label="심화" value={t.advanced_score} max={LEVEL_MAX3.advanced} />
        {areas.length > 0 && <div className="pt-1" />}
        {areas.map(([l, v]) => (
          <Bar key={l} label={l} value={v} max={100} weak={l === weak} />
        ))}
      </div>
      {t.memo && (
        <p className="mt-4 rounded-2xl bg-grey-50 px-4 py-3 text-[14px] leading-relaxed text-grey-700">
          <span className="mb-0.5 block text-[12px] text-grey-500">선생님 코멘트</span>
          {t.memo}
        </p>
      )}
    </div>
  );
}
