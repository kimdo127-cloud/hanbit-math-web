"use client";
// MY: 설정형 목록 (프로필 → 자녀 → 도움 → 계정). 자세한 내용은 하위 화면에서
// 자녀는 학원이 등록한다 (같은 보호자 번호로 등록하면 자동 연결) → '자녀 추가'는 안내만
import { ChevronRight, KeyRound, MessageCircleQuestion, Phone, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { BottomSheet, Button, Dialog, TextField, Toast, markBack } from "@/components/ui";
import { ACADEMY_PHONE, resetDemo, ApiError, changePassword, getFamilyContacts, GRADE_LABEL, listEnrollments, logout } from "@/lib/api";

function Row({ href, icon, title, sub, onClick }: { href?: string; icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; onClick?: (e: React.MouseEvent<HTMLElement>) => void }) {
  const body = (
    <>
      {icon && <span className="grid size-9 place-items-center rounded-full bg-grey-100 text-grey-700">{icon}</span>}
      <span className="flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        {sub && <span className="block text-[13px] text-grey-500">{sub}</span>}
      </span>
      <ChevronRight size={18} className="text-grey-400" />
    </>
  );
  const cls = "flex w-full items-center gap-3 px-5 py-4 text-left active:bg-grey-50";
  return href ? (
    <Link href={href} onClick={onClick} className={cls}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export default function MePage() {
  const router = useRouter();
  const { parent, children, reload } = useFamily();
  const [classes, setClasses] = useState<Record<number, string[]>>({});
  const [contactCount, setContactCount] = useState(0);
  const [sheet, setSheet] = useState<null | "password">(null);
  const [addInfo, setAddInfo] = useState(false);
  const [pw, setPw] = useState({ cur: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getFamilyContacts().then((c) => setContactCount(c.length));
    Promise.all(children.map(async (c) => [c.id, (await listEnrollments(c.id)).filter((e) => !e.end_date).map((e) => e.cls.name)] as const)).then((e) =>
      setClasses(Object.fromEntries(e)),
    );
  }, [children]);

  const run = async (fn: () => Promise<void>, done: string) => {
    setError("");
    try {
      await fn();
      setSheet(null);
      await reload();
      setToast(done);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <main className="pt-5">
      <div className="space-y-4 px-4 pt-1">
        <section className="rounded-3xl bg-white px-5 py-5">
          <p className="text-[20px] font-bold">{parent.name}</p>
          <p className="mt-0.5 text-[14px] text-grey-500">{parent.email}</p>
        </section>

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">자녀</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            {children.map((c) => (
              <Row
                key={c.id}
                href={`/me/child/${c.id}`}
                onClick={markBack}
                title={
                  <>
                    {c.name} <span className="ml-1 text-[13px] font-normal text-grey-500">{GRADE_LABEL[c.grade]} · {c.school}</span>
                  </>
                }
                sub={classes[c.id]?.length ? classes[c.id].join(", ") : "다니는 강좌 없음"}
              />
            ))}
            <button
              onClick={() => setAddInfo(true)}
              className="flex w-full items-center gap-2 px-5 py-4 text-[15px] font-semibold text-brand active:bg-grey-50"
            >
              <Plus size={18} /> 자녀 추가
            </button>
          </div>
        </section>

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">도움</h2>
          <div className="overflow-hidden rounded-3xl bg-white">
            <Row href="/me/ask" onClick={markBack} icon={<MessageCircleQuestion size={18} />} title="규정 묻기" sub="수강료 · 보강 · 환불 · 상담 시간" />
          </div>
          <p className="px-2 pt-2 text-[12px] text-grey-500">한빛수학 {ACADEMY_PHONE} · 학부모 상담 매월 마지막 주 토요일 10:00~13:00 (전화 예약)</p>
        </section>

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">계정</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            <Row href="/me/contacts" onClick={markBack} icon={<Phone size={18} />} title="보호자 연락처" sub={`${contactCount}개`} />
            <Row
              icon={<KeyRound size={18} />}
              title="비밀번호 변경"
              onClick={() => {
                setPw({ cur: "", next: "", confirm: "" });
                setError("");
                setSheet("password");
              }}
            />
          </div>
        </section>

        <button
          className="w-full py-3 text-[14px] text-grey-500 underline underline-offset-2"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          로그아웃
        </button>
        <button className="w-full py-2 text-[12px] text-grey-400" onClick={async () => { await resetDemo().catch(() => {}); router.replace("/login"); }}>
          (시연) 데이터 처음으로 되돌리기
        </button>
      </div>

      <BottomSheet open={sheet === "password"} onClose={() => setSheet(null)} title="비밀번호 변경">
        <div className="space-y-3">
          <TextField label="지금 비밀번호" type="password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
          <TextField label="새 비밀번호 (8자 이상)" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <TextField label="새 비밀번호 확인" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={error || undefined} />
        </div>
        <Button
          size="xl"
          className="mt-6 w-full"
          disabled={!pw.cur || !pw.next || !pw.confirm}
          onClick={() => (pw.next !== pw.confirm ? setError("새 비밀번호가 서로 달라요.") : run(() => changePassword(pw.cur, pw.next), "비밀번호를 바꿨어요"))}
        >
          바꾸기
        </Button>
      </BottomSheet>

      <Dialog
        open={addInfo}
        title="자녀는 학원에서 등록해요"
        body={`학원 상담 후 이 보호자 번호로 등록하면 앱에 자동으로 연결돼요.\n한빛수학 ${ACADEMY_PHONE}`}
        primary="확인"
        onPrimary={() => setAddInfo(false)}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
