import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한빛수학",
  description: "한빛수학 학부모 앱 — 수강, 출결, 납부를 한곳에서",
  appleWebApp: { capable: true, title: "한빛수학", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        {/* PC에서도 폰 너비로 보이게 */}
        <div className="mx-auto min-h-dvh max-w-[420px] bg-white shadow-[0_0_24px_rgba(0,0,0,0.04)]">{children}</div>
      </body>
    </html>
  );
}
