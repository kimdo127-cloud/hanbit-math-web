"use client";
// 알림함: 등원·지각·하원·결석, 레벨테스트 결과, 보강 확정, 미납. 같은 내용이 앱 푸시로도 간다
// 열면 모두 읽음. 누르면 해당 화면으로
import { Bell, CalendarCheck, ClipboardCheck, LogIn, LogOut, RefreshCcw, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader, TopBar, markBack } from "@/components/ui";
import { listNotifications, markNotificationsRead } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

const ICON: Record<AppNotification["kind"], { icon: typeof Bell; color: string }> = {
  arrive: { icon: LogIn, color: "text-success" },
  late: { icon: LogIn, color: "text-warning" },
  leave: { icon: LogOut, color: "text-grey-500" },
  absent: { icon: XCircle, color: "text-danger" },
  level_test: { icon: ClipboardCheck, color: "text-brand" },
  makeup: { icon: RefreshCcw, color: "text-brand" },
  unpaid: { icon: Wallet, color: "text-danger" },
};

// "10/29 16:50", 오늘이면 시각만
const when = (at: string, today: string) => (at.slice(0, 10) === today ? at.slice(11, 16) : `${Number(at.slice(5, 7))}/${Number(at.slice(8, 10))} ${at.slice(11, 16)}`);

export default function NotificationsPage() {
  const [list, setList] = useState<AppNotification[] | null>(null);
  useEffect(() => {
    listNotifications().then((l) => {
      setList(l);
      if (l.some((n) => !n.read_at)) markNotificationsRead().catch(() => {});
    });
  }, []);
  const today = list?.[0]?.created_at.slice(0, 10) ?? "";

  return (
    <main>
      <TopBar back title="알림" />
      {!list ? (
        <Loader />
      ) : list.length === 0 ? (
        <div className="px-4 pt-16 text-center text-[15px] text-grey-500">
          <CalendarCheck size={40} className="mx-auto mb-3 text-grey-400" />
          아직 알림이 없어요
        </div>
      ) : (
        <ul className="divide-y divide-grey-100 bg-white">
          {list.map((n) => {
            const { icon: Icon, color } = ICON[n.kind];
            return (
              <li key={n.id}>
                <Link href={n.link} onClick={markBack} className={`flex gap-3 px-5 py-4 active:bg-grey-50 ${n.read_at ? "" : "bg-brand-weak/40"}`}>
                  <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-grey-100 ${color}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-semibold">{n.title}</span>
                      <span className="tabular shrink-0 text-[12px] text-grey-500">{when(n.created_at, today)}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-grey-700">{n.body}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
