import { useEffect } from 'react'
import socket from '../lib/socket'
import useNotificationStore from '../stores/notificationStore'
import { showToast } from '../components/ToastProvider'

export function useSocketNotifications() {
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    socket.on('notification', (data) => {
      if (data.type === 'new_message') {
        // Ajouter dans la cloche
        addNotification({
          type: 'new_message',
          title: 'Nouveau message',
          body: data.content,
          conversationId: data.conversationId,
        })

        // Afficher le toast en bas à droite
        showToast({
          type: 'new_message',
          title: 'Nouveau message',
          body: data.content,
          ticket: data.ticketNumber ? `TKT-${data.ticketNumber}` : null,
          conversationId: data.conversationId,
        })
      }
    })

    return () => socket.off('notification')
  }, [])
}