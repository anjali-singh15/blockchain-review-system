import { createContext, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const pushNotification = (payload) => {
    const notification = {
      id: crypto.randomUUID(),
      type: payload.type || "info",
      title: payload.title,
      message: payload.message,
    };

    setNotifications((current) => [...current, notification]);
    setTimeout(() => {
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
    }, 3800);
  };

  const value = useMemo(
    () => ({
      notifications,
      pushNotification,
    }),
    [notifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }

  return context;
};
