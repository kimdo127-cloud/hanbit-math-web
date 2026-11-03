"use client";
// 토스 DESIGN.md 컴포넌트 규격 (button, text-field, chip, badge, list-row, dialog, toast, bottom-sheet)
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
type BtnSize = "xl" | "l" | "m" | "s";

const btnSize: Record<BtnSize, string> = {
  xl: "h-14 rounded-xl text-[17px] font-bold",
  l: "h-12 rounded-[14px] text-[17px] font-bold",
  m: "h-10 rounded-m text-[15px] font-semibold px-4",
  s: "h-8 rounded-[10px] text-[13px] font-semibold px-3",
};
const btnVariant: Record<BtnVariant, string> = {
  primary: "bg-brand text-white",
  secondary: "bg-grey-100 text-grey-900",
  danger: "bg-danger text-white",
  ghost: "bg-transparent text-brand",
};

export function Button({
  variant = "primary",
  size = "l",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button
      {...props}
      className={`${btnSize[size]} ${btnVariant[variant]} inline-flex items-center justify-center transition-[filter,opacity] duration-[120ms] active:brightness-75 disabled:opacity-30 ${className}`}
    />
  );
}

export function TextField({
  label,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-[13px] font-semibold text-grey-700">{label}</span>}
      <input
        {...props}
        className={`h-12 w-full rounded-m border bg-grey-100 px-4 text-[15px] outline-none transition-colors placeholder:text-grey-400 focus:border-[1.5px] focus:border-brand focus:bg-white ${
          error ? "border-[1.5px] border-danger" : "border-grey-200"
        }`}
      />
      {error && <span className="mt-1.5 block text-[13px] text-danger">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-[13px] font-semibold text-grey-700">{label}</span>}
      <select
        {...props}
        className="h-12 w-full appearance-none rounded-m border border-grey-200 bg-grey-100 px-4 text-[15px] outline-none focus:border-[1.5px] focus:border-brand focus:bg-white"
      >
        {children}
      </select>
    </label>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-[34px] shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors ${
        active ? "bg-grey-900 text-white" : "border border-grey-200 bg-white text-grey-700"
      }`}
    >
      {children}
    </button>
  );
}

type Tone = "brand" | "danger" | "success" | "warning" | "grey";
const toneCls: Record<Tone, string> = {
  brand: "bg-brand-weak text-brand",
  danger: "bg-danger-weak text-danger",
  success: "bg-success-weak text-success",
  warning: "bg-warning-weak text-warning",
  grey: "bg-grey-100 text-grey-700",
};

export function Badge({ tone = "grey", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-[22px] items-center rounded-[6px] px-2 text-[12px] font-semibold ${toneCls[tone]}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[17px] font-bold">{children}</h2>
      {right}
    </div>
  );
}

// 다른 화면에서 들어왔을 때만 뒤로 가기를 보여 준다 (하단 탭으로 들어오면 없음)
const BACK_KEY = "hanbit-back";
// 링크 onClick에 넣는다. 들어갈 화면 경로를 기억해 두고, 그 화면에서만 뒤로 가기를 보여 준다
export function markBack(e?: { currentTarget?: { getAttribute?: (n: string) => string | null } }) {
  try {
    const to = (e?.currentTarget?.getAttribute?.("href") ?? "").split("?")[0];
    sessionStorage.setItem(BACK_KEY, to);
  } catch {}
}
export function clearBack() {
  try {
    sessionStorage.removeItem(BACK_KEY);
  } catch {}
}

export function TopBar({ title, left, right, back }: { title?: React.ReactNode; left?: React.ReactNode; right?: React.ReactNode; back?: boolean }) {
  const [from, setFrom] = useState<string | null>(null);
  useEffect(() => {
    try {
      const to = sessionStorage.getItem(BACK_KEY);
      setFrom(to && to === location.pathname ? to : null);
    } catch {}
  }, []);
  const showBack = back || !!from;
  return (
    <header className="sticky top-0 z-10 mb-4 flex h-14 items-center gap-1 bg-white/95 px-5 backdrop-blur">
      {showBack && (
        <button
          aria-label="뒤로"
          onClick={() => {
            clearBack();
            history.back();
          }}
          className="-ml-2 grid size-10 place-items-center"
        >
          <ChevronLeft />
        </button>
      )}
      {left}
      <div className="flex-1 text-[20px] font-bold">{title}</div>
      {right}
    </header>
  );
}

export function MonthNav({ month, onChange }: { month: string; onChange: (diff: number) => void }) {
  const [y, m] = month.split("-");
  return (
    <div className="flex items-center gap-1">
      <button aria-label="이전 달" onClick={() => onChange(-1)} className="grid size-8 place-items-center rounded-full text-grey-700 active:bg-grey-100">
        <ChevronLeft size={20} />
      </button>
      <span className="tabular min-w-[86px] text-center text-[15px] font-semibold">
        {y}년 {Number(m)}월
      </span>
      <button aria-label="다음 달" onClick={() => onChange(1)} className="grid size-8 place-items-center rounded-full text-grey-700 active:bg-grey-100">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-sheet relative w-full max-w-[420px] rounded-t-2xl bg-white px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <h3 className="mb-4 text-[20px] font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Dialog({
  open,
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
  danger,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onSecondary} />
      <div className="animate-fade relative w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-[18px] font-bold">{title}</h3>
        {body && <div className="mt-2 text-[15px] leading-relaxed text-grey-700">{body}</div>}
        <div className="mt-6 flex gap-2">
          {secondary && (
            <Button variant="secondary" className="flex-1" onClick={onSecondary}>
              {secondary}
            </Button>
          )}
          <Button variant={danger ? "danger" : "primary"} className="flex-1" onClick={onPrimary}>
            {primary}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="animate-fade fixed inset-x-0 bottom-28 z-50 mx-auto w-fit max-w-[380px] rounded-[14px] bg-grey-900 px-5 py-3.5 text-[15px] font-medium text-white shadow-lg">
      {message}
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex justify-center gap-1.5 py-16">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 animate-pulse rounded-full bg-grey-400" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  );
}

export function won(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function fmtDate(d: string) {
  const dt = new Date(d + "T00:00");
  return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${"일월화수목금토"[dt.getDay()]})`;
}

export const WEEKDAY = "일월화수목금토";
