"use client";
// MY > 자녀 상세: 기본 정보 · 다니는 강좌(수강 중단) · 이 자녀의 보호자 연락처
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { BottomSheet, Button, Loader, Select, TextField, Toast, TopBar, WEEKDAY, fmtDate, markBack, won } from "@/components/ui";
import { ApiError, getWithdrawInfo, GRADE_LABEL, listEnrollments, today, updateChild, withdraw } from "@/lib/api";
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

  useEffect(() => {
    listEnrollments(id).then(setEnr);
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

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">보호자 연락처</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            {c.contacts.map((x) => (
              <Item key={x.id} k={x.relation} v={<span className="tabular">{x.phone}</span>} />
            ))}
            <Link href="/me/contacts" onClick={markBack} className="flex items-center justify-between px-5 py-4 text-[15px] font-semibold active:bg-grey-50">
              연락처 관리
              <ChevronRight size={18} className="text-grey-400" />
            </Link>
          </div>
        </section>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="자녀 정보 수정">
        <div className="space-y-3">
          <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="flex gap-2">
            <Select label="학년" className="w-28" value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) as Grade })}>
              {(Object.keys(GRADE_LABEL) as unknown as Grade[]).map((g) => <option key={g} value={g}>{GRADE_LABEL[g]}</option>)}
            </Select>
            <TextField label="학교" className="flex-1" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          </div>
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
