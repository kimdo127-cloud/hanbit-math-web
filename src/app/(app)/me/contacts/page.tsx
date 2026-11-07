"use client";
// MY > 보호자 연락처: 가족 단위로 한 번만 저장 (형제 모두에게 같은 번호). 대표 번호는 학원 초대·안내 문자를 받는 번호라 학원이 바꾼다
import { Phone, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BottomSheet, Button, Dialog, Loader, Select, TextField, Toast, TopBar } from "@/components/ui";
import { ACADEMY_PHONE, addFamilyContact, ApiError, getFamilyContacts, removeFamilyContact } from "@/lib/api";

const RELATIONS = ["엄마", "아빠", "할머니", "할아버지", "보호자"];
type Contact = Awaited<ReturnType<typeof getFamilyContacts>>[number];

export default function ContactsPage() {
  const [list, setList] = useState<Contact[] | null>(null);
  const [open, setOpen] = useState(false);
  const [ct, setCt] = useState({ relation: "아빠", phone: "" });
  const [del, setDel] = useState<Contact | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    getFamilyContacts().then(setList);
  }, []);
  useEffect(load, [load]);

  const add = async () => {
    setError("");
    try {
      await addFamilyContact(ct.relation, ct.phone);
      setOpen(false);
      setToast("연락처를 추가했어요");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  const remove = async () => {
    const c = del;
    setDel(null);
    if (!c) return;
    try {
      await removeFamilyContact(c.id);
      setToast("연락처를 지웠어요");
      load();
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <main>
      <TopBar back title="보호자 연락처" />
      {!list ? (
        <Loader />
      ) : (
        <div className="space-y-3 px-4 pt-1">
          <p className="px-1 text-[13px] text-grey-500">출결·보강·수납 안내를 받을 번호예요. 모든 자녀에게 같이 적용돼요.</p>
          <ul className="divide-y divide-grey-100 overflow-hidden rounded-3xl bg-white">
            {list.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-4">
                <span className="grid size-9 place-items-center rounded-full bg-grey-100 text-grey-700">
                  <Phone size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">
                    {c.relation} <span className="tabular ml-1 font-normal">{c.phone}</span>
                  </span>
                  {c.is_primary && <span className="block text-[13px] text-brand">대표 번호 · 학원 안내 문자를 받아요</span>}
                </span>
                {!c.is_primary && (
                  <button aria-label="연락처 삭제" onClick={() => setDel(c)} className="grid size-8 place-items-center text-grey-400">
                    <X size={18} />
                  </button>
                )}
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  setCt({ relation: "아빠", phone: "" });
                  setError("");
                  setOpen(true);
                }}
                className="flex w-full items-center gap-2 px-5 py-4 text-[15px] font-semibold text-brand active:bg-grey-50"
              >
                <Plus size={18} /> 연락처 추가
              </button>
            </li>
          </ul>
          <p className="px-1 text-[12px] text-grey-500">대표 번호를 바꾸려면 한빛수학({ACADEMY_PHONE})에 요청해 주세요.</p>
        </div>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="연락처 추가">
        <div className="flex gap-2">
          <Select label="관계" className="w-28" value={ct.relation} onChange={(e) => setCt({ ...ct, relation: e.target.value })}>
            {RELATIONS.map((r) => <option key={r}>{r}</option>)}
          </Select>
          <TextField label="연락처" className="flex-1" inputMode="tel" placeholder="010-0000-0000" value={ct.phone} onChange={(e) => setCt({ ...ct, phone: e.target.value })} />
        </div>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        <Button size="xl" className="mt-6 w-full" disabled={!ct.phone} onClick={add}>
          추가하기
        </Button>
      </BottomSheet>
      <Dialog
        open={!!del}
        title="연락처를 지울까요?"
        body={del ? `${del.relation} ${del.phone}` : ""}
        primary="지우기"
        secondary="닫기"
        danger
        onSecondary={() => setDel(null)}
        onPrimary={remove}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </main>
  );
}
