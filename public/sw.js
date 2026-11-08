// 앱 푸시 받기 (학부모 앱). 백엔드가 보낸 알림을 띄우고, 누르면 해당 화면을 연다
self.addEventListener("push", (event) => {
  let data = { title: "한빛수학", body: "", link: "/notifications" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png", badge: "/icon-192.png", data: { link: data.link } }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => "focus" in c);
      if (open) {
        open.navigate(link);
        return open.focus();
      }
      return self.clients.openWindow(link);
    }),
  );
});
