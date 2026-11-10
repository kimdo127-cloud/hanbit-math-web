"use client";
// MY > 고객센터 > 챗봇 문의 (과제의 "규정 묻기" 화면): 질문 → 백엔드 → Dify(규정 문서 검색 + GPT) → 답과 근거
// 답 형식: 굵은 결론 → 항목 3개 이내 → 📄 근거 안내 줄. 근거를 누르면 검색된 규정 원문(자세히 보기)
import { ArrowUp, FileText } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { BottomSheet, TopBar } from "@/components/ui";
import { ACADEMY_PHONE, ApiError, askRegulation, type RegulationAnswer } from "@/lib/api";

const SUGGESTED = ["보강 남은 거 있어요?", "이번 달 수강료 냈어요?", "중간에 그만두면 환불받아요?"];

type Msg = { role: "me"; text: string } | { role: "bot"; data: RegulationAnswer } | { role: "error"; text: string };

// **굵게** 만 처리 (답은 짧은 마크다운)
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((t, i) =>
        t.startsWith("**") && t.endsWith("**") ? (
          <strong key={i} className="font-bold text-grey-900">
            {t.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{t}</Fragment>
        ),
      )}
    </>
  );
}

function Answer({ data, onSource }: { data: RegulationAnswer; onSource: (s: RegulationAnswer["sources"]) => void }) {
  const lines = data.answer.split("\n").map((l) => l.trim()).filter(Boolean);
  const sourceLine = lines.find((l) => l.startsWith("📄"));
  const body = lines.filter((l) => l !== sourceLine);
  const bullets = body.filter((l) => l.startsWith("- "));
  const text = body.filter((l) => !l.startsWith("- "));
  // 근거 줄의 규정 이름과 같은 조항만 보여 준다 (없으면 검색된 조항 전체)
  // 근거 줄을 고객용 짧은 이름으로 맞춘다 (모델이 가끔 정식 이름을 씀)
  const [rawReg, ...topics] = (sourceLine?.replace(/^📄\s*/, "").replace(/\s*›\s*$/, "") ?? "").split(" · ");
  const regName = /수강료|수강 계약/.test(rawReg) ? "수강료 규정" : /출결|보강/.test(rawReg) ? "출결·보강 규정" : /환불|중단|상담/.test(rawReg) ? "환불·상담 규정" : rawReg;
  const sourceLabel = [regName, ...topics].join(" · ");
  const cited = data.sources.filter((s) => s.regulation === regName);
  return (
    <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-grey-700">
      {text.map((l, i) => (
        <p key={i}>
          <Inline text={l} />
        </p>
      ))}
      {bullets.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {bullets.map((l, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-grey-400">·</span>
              <span>
                <Inline text={l.slice(2)} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {sourceLine && data.sources.length > 0 && (
        <button onClick={() => onSource(cited.length ? cited : data.sources)} className="mt-2.5 flex items-center gap-1 text-[13px] text-grey-500 active:text-grey-700">
          <FileText size={14} />
          {sourceLabel}
          <span className="ml-0.5">›</span>
        </button>
      )}
      {data.classes && data.classes.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-grey-100 pt-3">
          {data.classes.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`} className="flex items-center justify-between rounded-xl bg-brand-weak px-3.5 py-2.5 text-[14px] font-semibold text-brand active:opacity-80">
              <span>{c.name} 강좌 보기</span>
              <span className="text-[12px] font-medium">{c.seatsLeft}자리 남음 ›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AskPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<RegulationAnswer["sources"] | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setQ("");
    setMsgs((m) => [...m, { role: "me", text: question }]);
    setBusy(true);
    try {
      const data = await askRegulation(question);
      setMsgs((m) => [...m, { role: "bot", data }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "error", text: e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col">
      <TopBar title="챗봇 문의" back />

      <div className="flex-1 space-y-3 px-4 pt-2 pb-36">
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-grey-700">
          안녕하세요, 한빛수학 챗봇이에요. 무엇을 도와드릴까요?
        </div>
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-full border border-grey-200 bg-white px-3.5 py-2 text-[14px] text-grey-700 active:bg-grey-50">
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) =>
          m.role === "me" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[80%] rounded-2xl rounded-tr-md bg-brand px-4 py-2.5 text-[15px] text-white">{m.text}</p>
            </div>
          ) : m.role === "bot" ? (
            <Answer key={i} data={m.data} onSource={setSource} />
          ) : (
            <p key={i} className="max-w-[85%] rounded-2xl rounded-tl-md bg-danger-weak px-4 py-3 text-[14px] text-danger">
              {m.text}
            </p>
          ),
        )}
        {busy && (
          <div className="flex w-16 justify-center gap-1 rounded-2xl rounded-tl-md bg-white py-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-grey-400" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      {/* 입력창 (하단 고정) */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[420px] bg-grey-100 px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
          className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-4"
        >
          <input
            id="ask-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={300}
            placeholder="예: 보강은 언제까지 신청해요?"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-grey-400"
          />
          <button type="submit" aria-label="보내기" disabled={!q.trim() || busy} className="grid size-9 place-items-center rounded-full bg-brand text-white disabled:bg-grey-200">
            <ArrowUp size={18} />
          </button>
        </form>
        <p className="pt-1.5 text-center text-[11px] text-grey-500">답은 학원 규정과 우리 아이 정보를 바탕으로 해요. 정확한 상담은{" "}
          <a href={`tel:${ACADEMY_PHONE}`} className="underline underline-offset-2">
            {ACADEMY_PHONE}
          </a>
        </p>
      </div>

      <BottomSheet open={!!source} onClose={() => setSource(null)} title="근거 규정">
        <div className="max-h-[60dvh] space-y-3 overflow-y-auto">
          {source?.map((s, i) => (
            <div key={i} className="rounded-xl bg-grey-50 px-4 py-3">
              <p className="text-[12px] font-semibold text-brand">{s.regulation}</p>
              <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-line text-grey-700">{s.content}</p>
            </div>
          ))}
        </div>
      </BottomSheet>
    </main>
  );
}
