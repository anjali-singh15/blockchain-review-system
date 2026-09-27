import { useNotification } from "../context/NotificationContext";

const toneMap = {
  success: "border-emerald-400/40 bg-emerald-500/15 text-slate-950 dark:text-emerald-100",
  error: "border-rose-400/40 bg-rose-500/15 text-black dark:text-rose-100",
  info: "border-sky-400/40 bg-sky-500/15 text-slate-950 dark:text-sky-100",
};

const NotificationStack = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed bottom-6 right-6 z-30 flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-2xl border px-4 py-3 shadow-soft backdrop-blur ${toneMap[notification.type]}`}
        >
          <p className="font-semibold">{notification.title}</p>
          <p className="mt-1 text-sm opacity-90">{notification.message}</p>
        </div>
      ))}
    </div>
  );
};

export default NotificationStack;
