"use client";
import { ChevronLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Select, TextField } from "@/components/ui";
import { ApiError, checkEmail, GRADE_LABEL, signup, type SignupChild } from "@/lib/api";
import type { Grade } from "@/lib/types";

const emptyChild = (): SignupChild => ({ name: "", grade: 7, school: "", birth_date: "" });

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ email: "", password: "", password2: "", name: "", phone: "", relation: "엄마" });
  const [kids, setKids] = useState<SignupChild[]>([emptyChild()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pwMismatch = !!form.password2 && form.password !== form.password2;
  const step1Valid = form.email && form.password.length >= 8 && form.password === form.password2 && form.name && form.phone;
  const step2Valid = kids.every((k) => k.name && k.school && k.birth_date);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await signup({ ...form, children: kids });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "잠시 후 다시 시도해 주세요.");
      if (err instanceof ApiError && err.status === 409) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const next = async () => {
    setBusy(true);
    setError("");
    try {
      await checkEmail(form.email);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const setKid =(i: number, patch: Partial<SignupChild>) => setKids((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-14 items-center px-3">
        {step === 1 ? (
          <Link href="/login" aria-label="뒤로" className="grid size-10 place-items-center">
            <ChevronLeft />
          </Link>
        ) : (
          <button aria-label="뒤로" onClick={() => setStep(1)} className="grid size-10 place-items-center">
            <ChevronLeft />
          </button>
        )}
        <span className="ml-auto pr-3 text-[13px] text-grey-500">{step}/2</span>
      </header>

      <div className="flex-1 px-6 pb-32">
        {step === 1 ? (
          <>
            <h1 className="text-[24px] font-bold">보호자 정보를 알려 주세요</h1>
            <div className="mt-8 space-y-4">
              <TextField label="이메일" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={error || undefined} />
              <TextField
                label="비밀번호 (8자 이상)"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <TextField
                label="비밀번호 확인"
                type="password"
                value={form.password2}
                onChange={(e) => setForm({ ...form, password2: e.target.value })}
                error={pwMismatch ? "비밀번호가 서로 달라요." : undefined}
              />
              <TextField label="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="flex gap-2">
                <Select label="관계" className="w-28" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
                  {["엄마", "아빠", "보호자"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Select>
                <TextField
                  label="연락처"
                  className="flex-1"
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[24px] font-bold">자녀 정보를 알려 주세요</h1>
            <p className="mt-2 text-[15px] text-grey-700">형제가 함께 다니면 둘째부터 수강료 10% 할인돼요.</p>
            <div className="mt-6 space-y-4">
              {kids.map((k, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-grey-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold">자녀 {i + 1}</span>
                    {kids.length > 1 && (
                      <button aria-label="자녀 삭제" onClick={() => setKids(kids.filter((_, j) => j !== i))} className="text-grey-400">
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <TextField label="이름" value={k.name} onChange={(e) => setKid(i, { name: e.target.value })} />
                  <div className="flex gap-2">
                    <Select label="학년" className="w-28" value={k.grade} onChange={(e) => setKid(i, { grade: Number(e.target.value) as Grade })}>
                      {(Object.keys(GRADE_LABEL) as unknown as Grade[]).map((g) => (
                        <option key={g} value={g}>
                          {GRADE_LABEL[g]}
                        </option>
                      ))}
                    </Select>
                    <TextField label="학교" className="flex-1" value={k.school} onChange={(e) => setKid(i, { school: e.target.value })} />
                  </div>
                  <TextField label="생년월일" type="date" value={k.birth_date} onChange={(e) => setKid(i, { birth_date: e.target.value })} />
                </div>
              ))}
              <Button variant="secondary" size="m" className="w-full gap-1" onClick={() => setKids([...kids, emptyChild()])}>
                <Plus size={18} /> 자녀 추가
              </Button>
              {error && <p className="text-[13px] text-danger">{error}</p>}
            </div>
          </>
        )}
      </div>

      {/* bottom-cta */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[420px] bg-gradient-to-t from-white via-white to-transparent px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {step === 1 ? (
          <Button size="xl" className="w-full" disabled={!step1Valid || busy} onClick={next}>
            다음
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
