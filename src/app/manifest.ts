// 홈 화면에 추가했을 때 앱처럼 열리게 (아이폰은 홈 화면에 추가해야 앱 푸시를 받을 수 있다)
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "한빛수학",
    short_name: "한빛수학",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
