"use client";
// MY: 설정형 목록 (프로필 → 자녀 → 계정 → 고객센터). 자세한 내용은 하위 화면에서
// 고객센터: 보통 앱처럼 챗봇 문의 + 전화 문의를 한 묶음으로 (챗봇 = 과제의 "규정 묻기" 화면)
// 자녀는 학원이 등록한다 (같은 보호자 번호로 등록하면 자동 연결) → '자녀 추가'는 안내만
import { Bot, ChevronRight, Headphones, KeyRound, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFamily } from "@/components/family";
import { BottomSheet, Button, TextField, Toast, markBack } from "@/components/ui";
import { ACADEMY_PHONE, ApiError, changePassword, getFamilyContacts, GRADE_LABEL, listEnrollments, logout } from "@/lib/api";

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
          </div>
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

        <section>
          <h2 className="px-2 pb-2 text-[13px] font-semibold text-grey-500">고객센터</h2>
          <div className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            <Row href="/me/ask" onClick={markBack} icon={<Bot size={18} />} title="챗봇 문의" sub="수강료 · 보강 · 환불 규정을 바로 안내해요" />
            <Row href={`tel:${ACADEMY_PHONE}`} icon={<Headphones size={18} />} title="전화 문의" sub={`${ACADEMY_PHONE} · 평일 14:00~22:00`} />
          </div>
          <p className="px-2 pt-2 text-[12px] text-grey-500">학부모 상담은 매월 마지막 주 토요일 10:00~13:00, 전화로 예약해 주세요.</p>
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

      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
