"use client";
// MY > 자녀 상세: 기본 정보 · 레벨테스트 · 다니는 강좌(수강 중단). 연락처는 가족 공통이라 MY › 보호자 연락처에서만
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { BottomSheet, Button, Loader, TextField, Toast, TopBar, WEEKDAY, fmtDate, won } from "@/components/ui";
import { ApiError, getLevelTests, getWithdrawInfo, GRADE_LABEL, listEnrollments, today, updateChild, withdraw } from "@/lib/api";
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
  const [allTests, setAllTests] = useState(false);

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
          </div>
        </section>

        {lv && (
          <section>
            <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">레벨테스트</h2>
            <div className="overflow-hidden rounded-3xl bg-white">
              {lv.latest ? (
                <div className="px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[13px] text-grey-500">
                      {fmtDate(lv.latest.tested_on)} · {lv.latest.kindLabel} 테스트
                    </p>
                    <span className="rounded-full bg-brand-weak px-2.5 py-0.5 text-[13px] font-bold text-brand">{lv.latest.result_level}</span>
                  </div>
                  <p className="mt-1 text-[22px] font-bold tabular">
                    {lv.latest.total_score}
                    <span className="text-[15px] font-semibold text-grey-500">점</span>
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["개념", lv.latest.concept_score, 40],
                      ["유형", lv.latest.type_score, 40],
                      ["심화", lv.latest.advanced_score, 20],
                    ].map(([k, v, m]) => (
                      <div key={k} className="rounded-2xl bg-grey-50 py-2">
                        <p className="text-[12px] text-grey-500">{k}</p>
                        <p className="text-[15px] font-semibold tabular">
                          {v}
                          <span className="text-[12px] font-normal text-grey-400">/{m}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  {lv.canAdvance && <p className="mt-3 rounded-2xl bg-brand-weak px-3 py-2.5 text-[13px] text-brand">선행 테스트를 통과했어요. 선행반은 상담 후 학원에서 신청해 드려요.</p>}
                </div>
              ) : (
                <p className="px-5 py-4 text-[15px] text-grey-500">아직 레벨테스트 기록이 없어요. 학원 상담 때 볼 수 있어요.</p>
              )}
              <p className="border-t border-grey-100 px-5 py-3 text-[13px] text-grey-500">다음 정기 테스트 {fmtDate(lv.nextRegular)} · 2월·8월에 봐요</p>
              {lv.tests.length > 1 && (
                <>
                  {allTests &&
                    lv.tests.map((t) => (
                      <div key={t.id} className="flex justify-between border-t border-grey-100 px-5 py-3 text-[14px]">
                        <span className="text-grey-700">
                          {fmtDate(t.tested_on)} · {t.kindLabel}
                        </span>
                        <span className="font-semibold tabular">
                          {t.total_score}점 · {t.kind === "advance" ? (t.advance_ok ? "선행 통과" : "선행 미통과") : t.result_level}
                        </span>
                      </div>
                    ))}
                  <button onClick={() => setAllTests((v) => !v)} className="w-full border-t border-grey-100 px-5 py-3 text-[14px] font-semibold text-grey-700 active:bg-grey-50">
                    {allTests ? "접기" : `지난 기록 ${lv.tests.length}건 보기`}
                  </button>
                </>
              )}
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
            <Link href="/classes" className="flex items-center justify-between px-5 py-4 text-[15px] font-semibold active:bg-grey-50">
              다른 강좌 찾아보기
              <ChevronRight size={18} className="text-grey-400" />
            </Link>
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
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
