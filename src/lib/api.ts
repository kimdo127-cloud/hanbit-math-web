// 화면이 부르는 함수 모음. 함수 이름·모양은 목업 때와 같고, 안에서 백엔드(NestJS)를 부른다
// POST {API}/api/web/<함수 이름>  { args: [...] }  · 로그인 토큰은 Authorization 헤더로
import type * as M from "./api.mock";
export type * from "./api.mock";
export { ACADEMY_PHONE, GRADE_LABEL, today } from "./api.mock";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "hanbit-token";
const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const setToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

async function call<T>(fn: string, args: unknown[]): Promise<T> {
  let res: Response;
  try {
    const token = getToken();
    res = await fetch(`${API}/api/web/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ args }),
    });
  } catch {
    throw new ApiError("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null); // 토큰 만료 → 다시 로그인
    throw new ApiError(body.message ?? "잠시 후 다시 시도해 주세요.", res.status);
  }
  if (body.token) setToken(body.token);
  return body.data as T;
}

// 목업 함수와 같은 이름·타입으로 백엔드를 부르는 함수를 만든다
const rpc = <K extends keyof typeof M>(name: K) => ((...args: unknown[]) => call(name as string, args)) as unknown as (typeof M)[K];

export const login = rpc("login");
export const signup = rpc("signup");
export function logout() {
  setToken(null);
}
export function isLoggedIn() {
  return !!getToken();
}
export async function resetDemo() {
  await call("resetDemo", []);
  setToken(null);
}

export const checkEmail = rpc("checkEmail");
export const checkGuardian = rpc("checkGuardian");
export const askRegulation = rpc("askRegulation");
export const getMe = rpc("getMe");
export const getHome = rpc("getHome");
export const listEnrollments = rpc("listEnrollments");
export const listClassesFor = rpc("listClassesFor");
export const enroll = rpc("enroll");
export const withdraw = rpc("withdraw");
export const getAttendance = rpc("getAttendance");
export const getPayments = rpc("getPayments");
export const changePassword = rpc("changePassword");
export const updateChild = rpc("updateChild");
export const addChild = rpc("addChild");
export const getMakeups = rpc("getMakeups");
export const requestMakeup = rpc("requestMakeup");
export const cancelMakeup = rpc("cancelMakeup");
export const getChildHome = rpc("getChildHome");
export const getFamilyUnpaid = rpc("getFamilyUnpaid");
export const getPaymentHistory = rpc("getPaymentHistory");
export const getFamilyContacts = rpc("getFamilyContacts");
export const addFamilyContact = rpc("addFamilyContact");
export const removeFamilyContact = rpc("removeFamilyContact");
export const getWithdrawInfo = rpc("getWithdrawInfo");
export const getFamilyWeek = rpc("getFamilyWeek");
export const listAllClasses = rpc("listAllClasses");
export const getClassDetail = rpc("getClassDetail");
export const enrollMany = rpc("enrollMany");
export const getPlanned = rpc("getPlanned");
export const getLevelTests = rpc("getLevelTests");
export const getLevelTestNotice = rpc("getLevelTestNotice");
export const getLevelTestDates = rpc("getLevelTestDates");
