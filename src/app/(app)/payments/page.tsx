"use client";
// 납부: 미납이 있을 때만 요약, 내역은 월별로 묶어서 최근 달부터 (월 화살표 없이 스크롤)
import { useEffect, useState } from "react";
import { Badge, Card, Loader, won } from "@/components/ui";
import { ACADEMY_PHONE, getPaymentHistory } from "@/lib/api";

export default function PaymentsPage() {
  const [groups, setGroups] = useState<Awaited<ReturnType<typeof getPaymentHistory>> | null>(null);
  useEffect(() => {
    getPaymentHistory().then(setGroups);
  }, []);

  const unpaid = groups?.flatMap((g) => g.rows).filter((r) => r.status === "unpaid") ?? [];
  const unpaidTotal = unpaid.reduce((t, r) => t + r.amount, 0);

  return (
    <main className="pt-5">
      {!groups ? (
        <Loader />
      ) : (
        <div className="space-y-3 px-4 pt-1">
          {unpaidTotal > 0 && (
            <Card className="border border-danger-weak">
              <p className="text-[13px] text-grey-700">아직 안 낸 금액</p>
              <p className="tabular mt-1 text-[28px] font-bold text-danger">{won(unpaidTotal)}</p>
              <p className="mt-1 text-[13px] text-grey-500">
                {unpaid.map((r) => `${Number(r.month.slice(5))}월 ${r.studentName}`).join(", ")}
              </p>
              <div className="mt-3 border-t border-grey-100 pt-3">
                <p className="text-[13px] text-grey-700">수강료는 학원에 직접 내요. 납부 방법은 학원에 문의해 주세요.</p>
                <a href={`tel:${ACADEMY_PHONE}`} className="mt-2.5 flex h-11 items-center justify-center rounded-xl bg-grey-100 text-[14px] font-semibold text-grey-900 active:bg-grey-200">
                  학원에 전화하기 · {ACADEMY_PHONE}
                </a>
              </div>
            </Card>
          )}
          {groups.length === 0 && <Card className="text-center text-[15px] text-grey-700">납부 내역이 없어요.</Card>}
          {groups.map((g) => (
            <section key={g.month}>
              <h2 className="px-1 pt-2 pb-2 text-[14px] font-bold text-grey-700">
                {g.month.slice(0, 4)}년 {Number(g.month.slice(5))}월
              </h2>
              <ul className="divide-y divide-grey-200 overflow-hidden rounded-3xl bg-white">
                {g.rows.map((r) => (
                  <li key={`${r.studentId}-${r.classId}`} className="flex items-center gap-3 px-5 py-4">
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold">
                        {r.studentName} · {r.className}
                      </p>
                      <p className="mt-0.5 text-[13px] text-grey-500">
                        {[r.discount ? "형제 할인 10%" : "기본 수강료", r.partial && `첫 달 ${r.partial.count}/${r.partial.total}회분`].filter(Boolean).join(" · ")}
                        {r.paidAt && ` · ${Number(r.paidAt.slice(5, 7))}월 ${Number(r.paidAt.slice(8))}일 납부`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-[15px] font-bold">{won(r.paidAmount ?? r.amount)}</p>
                      {r.status === "paid" ? <Badge tone="success">납부</Badge> : <Badge tone="danger">미납</Badge>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
