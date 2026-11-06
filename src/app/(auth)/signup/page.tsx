"use client";
// 회원가입: 학원에 등록된 보호자만 가입한다 (한빛수학 등록 학부모 전용 앱)
// 1단계 학원에 등록한 휴대폰 번호 + 자녀 이름 확인 → 2단계 계정 만들기. 자녀는 학원이 등록해 둔 정보로 자동 연결
// 가입은 학원이 보낸 초대 문자의 링크(/signup?code=…)로만: 코드가 없으면 안내만 보여 주고, 코드는 백엔드가 번호와 맞는지 검증
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { ACADEMY_PHONE, ApiError, checkEmail, checkGuardian, GRADE_LABEL, signup } from "@/lib/api";
import type { Grade } from "@/lib/types";

type Kid = { name: string; grade: Grade; school: string };

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ phone: "", childName: "", email: "", password: "", password2: "", name: "" });
  const [kids, setKids] = useState<Kid[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null); // 초대 링크의 코드 ("" = 링크 없이 들어옴)
  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get("code") ?? "");
  }, []);

  const pwMismatch = !!form.password2 && form.password !== form.password2;
  const step1Valid = form.phone.replace(/[^0-9]/g, "").length >= 10 && form.childName.trim();
  const step2Valid = form.name.trim() && form.email && form.password.length >= 8 && form.password === form.password2;

  const run = async (f: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await f();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const next = () =>
    run(async () => {
      const r = await checkGuardian(form.phone, form.childName, code ?? "");
      setKids(r.children);
      setStep(2);
    });

  const submit = () =>
    run(async () => {
      await checkEmail(form.email);
      await signup({ email: form.email, password: form.password, name: form.name, phone: form.phone, childName: form.childName, code: code ?? "" });
      router.replace("/");
    });

  if (code === null) return null;
  if (!code)
    return (
      <main className="flex min-h-dvh flex-col bg-white">
        <header className="flex h-14 items-center px-3">
          <Link href="/login" aria-label="뒤로" className="grid size-10 place-items-center">
            <ChevronLeft />
          </Link>
        </header>
        <div className="flex-1 px-6">
          <h1 className="text-[24px] font-bold">초대 문자의 링크로 가입해 주세요</h1>
          <p className="mt-3 text-[15px] leading-6 text-grey-700">
            한빛수학 앱은 학원에 등록한 학부모만 쓸 수 있어요. 상담 후 학원이 보내 드린 초대 문자의 링크를 눌러 가입해 주세요.
          </p>
          <p className="mt-6 rounded-xl bg-grey-50 px-4 py-3 text-[13px] leading-5 text-grey-600">
            문자를 받지 못했다면 학원으로 연락해 주세요.
            <br />
            한빛수학 {ACADEMY_PHONE}
          </p>
        </div>
      </main>
    );

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-14 items-center px-3">
        {step === 1 ? (
          <Link href="/login" aria-label="뒤로" className="grid size-10 place-items-center">
            <ChevronLeft />
          </Link>
        ) : (
          <button aria-label="뒤로" onClick={() => (setStep(1), setError(""))} className="grid size-10 place-items-center">
            <ChevronLeft />
          </button>
        )}
        <span className="ml-auto pr-3 text-[13px] text-grey-500">{step}/2</span>
      </header>

      <div className="flex-1 px-6 pb-32">
        {step === 1 ? (
          <>
            <h1 className="text-[24px] font-bold">학원에 등록한 정보를 확인할게요</h1>
            <p className="mt-2 text-[15px] text-grey-700">상담 때 학원에 알려 준 보호자 번호로 가입하면, 자녀 정보가 자동으로 연결돼요.</p>
            <div className="mt-8 space-y-4">
              <TextField
                label="보호자 휴대폰 번호"
                inputMode="tel"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <TextField label="자녀 이름" placeholder="학원에 다니는 자녀 한 명" value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} />
              {error && <p className="text-[13px] text-danger">{error}</p>}
              <p className="rounded-xl bg-grey-50 px-4 py-3 text-[13px] leading-5 text-grey-600">
                아직 학원에 등록하지 않았다면 먼저 상담을 받아 주세요.
                <br />
                한빛수학 {ACADEMY_PHONE}
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold">계정을 만들어 주세요</h1>
            <div className="mt-4 rounded-xl bg-brand-weak px-4 py-3">
              <p className="text-[13px] text-grey-600">연결될 자녀</p>
              <p className="mt-1 text-[15px] font-semibold text-grey-900">
                {kids.map((k) => `${k.name} (${GRADE_LABEL[k.grade]})`).join(" · ")}
              </p>
            </div>
            <div className="mt-6 space-y-4">
              <TextField label="보호자 이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="이메일 (로그인 아이디)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="비밀번호 (8자 이상)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <TextField
                label="비밀번호 확인"
                type="password"
                value={form.password2}
                onChange={(e) => setForm({ ...form, password2: e.target.value })}
                error={pwMismatch ? "비밀번호가 서로 달라요." : undefined}
              />
              {error && <p className="text-[13px] text-danger">{error}</p>}
            </div>
          </>
        )}
      </div>

      {/* bottom-cta */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[420px] bg-gradient-to-t from-white via-white to-transparent px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {step === 1 ? (
          <Button size="xl" className="w-full" disabled={!step1Valid || busy} onClick={next}>
            {busy ? "확인 중…" : "확인"}
          </Button>
        ) : (
          <Button size="xl" className="w-full" disabled={!step2Valid || busy} onClick={submit}>
            {busy ? "가입 중…" : "가입하기"}
          </Button>
        )}
      </div>
    </main>
  );
}
