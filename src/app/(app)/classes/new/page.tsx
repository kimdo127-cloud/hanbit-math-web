import { redirect } from "next/navigation";

// 수강 신청은 수강 탭(/classes) 안으로 합쳤다
export default function NewEnrollmentPage() {
  redirect("/classes");
}
