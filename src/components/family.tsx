"use client";
// 로그인 확인 + 가족(자녀) 정보 + 선택한 자녀를 화면들이 같이 쓴다
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, isLoggedIn } from "@/lib/api";
import type { Student, StudentContact } from "@/lib/types";
import { Loader } from "./ui";

type Child = Student & { contacts: StudentContact[] };
interface FamilyCtx {
  parent: { id: number; name: string; email: string };
  children: Child[];
  childId: number;
  setChildId: (id: number) => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<FamilyCtx | null>(null);
const CHILD_KEY = "hanbit-child";

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<Awaited<ReturnType<typeof getMe>> | null>(null);
  const [childId, setChildIdState] = useState<number>(0);

  const reload = useCallback(async () => {
    const me = await getMe();
    setData(me);
    setChildIdState((cur) => {
      if (me.children.some((c) => c.id === cur)) return cur;
      let saved = 0;
      try {
        saved = Number(localStorage.getItem(CHILD_KEY));
      } catch {}
      return me.children.some((c) => c.id === saved) ? saved : me.children[0]?.id ?? 0;
    });
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    reload();
  }, [reload, router, pathname]);

  const setChildId = (id: number) => {
    setChildIdState(id);
    try {
      localStorage.setItem(CHILD_KEY, String(id));
    } catch {}
  };

  if (!data) return <Loader />;
  return (
    <Ctx.Provider value={{ parent: data.parent, children: data.children, childId, setChildId, reload }}>{children}</Ctx.Provider>
  );
}

export function useFamily() {
  const v = useContext(Ctx);
  if (!v) throw new Error("FamilyProvider 밖");
  return v;
}

// 자녀 전환: 제목 아래 한 줄. 둘 이상이면 칩을 나란히, 많아지면 좌우 스와이프
export function ChildTabs() {
  const { children, childId, setChildId } = useFamily();
  if (children.length <= 1) return <p className="px-5 pb-3 text-[15px] font-bold">{children[0]?.name}</p>;
  return (
    <div className="-mt-1 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" role="tablist" aria-label="자녀 선택">
      {children.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={c.id === childId}
          onClick={() => setChildId(c.id)}
          className={`h-9 shrink-0 rounded-full px-4 text-[15px] font-semibold ${c.id === childId ? "bg-grey-900 text-white" : "bg-grey-100 text-grey-700"}`}
        >
          {c.name.slice(1)}
        </button>
      ))}
    </div>
  );
}
