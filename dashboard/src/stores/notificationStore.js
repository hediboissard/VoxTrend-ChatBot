import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notif) =>
    set((state) => ({
      notifications: [
        { ...notif, id: crypto.randomUUID(), read: false },
        ...state.notifications,
      ],
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}))

export default useNotificationStore