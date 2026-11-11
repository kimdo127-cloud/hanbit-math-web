"use client";
import { useEffect, useState } from "react";

// 무료 서버(Render)는 오래 쉬면 잠들어 깨는 데 20~30초가 걸린다.
// 화면이 열리자마자 서버를 깨우고, 3초 넘게 걸리면 "준비 중" 안내를 잠깐 띄운다.
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function WarmUp() {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    let done = false;
    const t = setTimeout(() => !done && setWaking(true), 3000);
    fetch(`${API}/health`, { cache: "no-store" })
      .catch(() => {})
      .finally(() => {
        done = true;
        clearTimeout(t);
        setWaking(false);
      });
    return () => clearTimeout(t);
  }, []);
  if (!waking) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-grey-900/90 px-4 py-2 text-[13px] font-medium text-white shadow-lg">
      서버를 준비하고 있어요 · 잠시만 기다려 주세요
    </div>
  );
}
