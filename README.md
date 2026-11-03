# hanbit-math-web

한빛수학 **코어 웹** (보호자용, 모바일 웹앱) · Next.js · 디자인: 토스 DESIGN.md

- 홈(가족 전체·오늘 수업·등원 시각) · 캘린더(출결·보강·예정 수업) · 수강 신청 · 납부 · MY
- 백엔드: hanbit-math-backend (`src/lib/api.ts`가 호출)

## 실행

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=백엔드 주소
npm install
npm run dev
```

Vercel 환경 변수: `NEXT_PUBLIC_API_URL` = Render 백엔드 주소. 무료 백엔드는 잠들어 있으면 첫 요청이 30초~1분 걸릴 수 있다.

시연 계정: `demo@hanbit.kr` / `hanbit1234`
