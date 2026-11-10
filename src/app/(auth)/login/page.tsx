"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { ApiError, isLoggedIn, login } from "@/lib/api";

// 시드 데이터의 시연 계정 (lib/seed.ts)
const TEST_ACCOUNT = { email: "demo@hanbit.kr", password: "hanbit1234" };

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 이미 로그인했으면 홈으로
  useEffect(() => {
    if (isLoggedIn()) router.replace(next);
  }, [router, next]);

  const quickLogin = async (id: string, pw: string) => {
    setEmail(id);
    setPassword(pw);
    setBusy(true);
    setError("");
    try {
      await login(id, pw);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col bg-white px-6 pt-20">
      <p className="text-[15px] font-semibold text-brand">한빛수학</p>
      <h1 className="mt-2 text-[26px] leading-snug font-bold">
        우리 아이 수업,
        <br />
        한곳에서 확인해요
      </h1>
      <form onSubmit={submit} className="mt-10 space-y-4">
        <TextField label="이메일" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error || undefined}
        />
        <Button size="xl" className="mt-4 w-full" disabled={busy || !email || !password}>
          {busy ? "확인 중…" : "로그인"}
        </Button>
      </form>
      <p className="mt-6 text-center text-[14px] text-grey-700">
        가입은 학원에서 받은 <b className="font-semibold text-grey-900">초대 문자의 링크</b>로 할 수 있어요.
      </p>
      {/* 테스트용: 시연 계정으로 바로 로그인 (어드민 로그인 화면과 같은 모양) */}
      <div className="mt-8 border-t border-grey-200 pt-6 pb-8">
        <p className="mb-3 text-[12px] font-semibold text-grey-500">테스트 계정으로 로그인</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => quickLogin(TEST_ACCOUNT.email, TEST_ACCOUNT.password)}
          className="w-full rounded-xl border border-grey-200 bg-white px-2 py-3 text-center active:bg-grey-50 disabled:opacity-40"
        >
          <span className="block text-[14px] font-semibold">학부모</span>
          <span className="mt-0.5 block text-[11px] text-grey-500">김민정 · 서준·하린 보호자</span>
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
