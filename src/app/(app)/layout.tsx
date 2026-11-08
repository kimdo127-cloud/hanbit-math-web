"use client";
// 하단 탭: 홈 · 캘린더(출결·보강·예정 수업) · 수강 신청 · 납부 · MY. 탭 첫 화면은 제목 헤더 없음(홈만 로고) 보강은 결석이 있을 때만 생기는 일이라 탭이 아니라 홈·출결에서 들어간다
import { BookOpen, CalendarDays, Home, Receipt, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FamilyProvider } from "@/components/family";
import { clearBack } from "@/components/ui";

const TABS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/attendance", label: "캘린더", icon: CalendarDays },
  { href: "/classes", label: "수강 신청", icon: BookOpen },
  { href: "/payments", label: "납부", icon: Receipt },
  { href: "/me", label: "MY", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // 상세(하위) 화면은 하단 탭을 숨겨 하던 일에서 이탈하지 않게 한다
  const detail = /^\/(makeup|notifications|classes\/\d+|me\/.+)/.test(pathname);
  return (
    <FamilyProvider>
      <div className={`min-h-dvh bg-grey-100 ${detail ? "pb-10" : "pb-28"}`}>{children}</div>
      {!detail && <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[420px] px-4 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="flex h-16 items-center rounded-3xl border border-grey-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" || pathname.startsWith("/makeup") : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={clearBack}
                className={`flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium ${active ? "text-grey-900" : "text-grey-400"}`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.6} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>}
    </FamilyProvider>
  );
}
