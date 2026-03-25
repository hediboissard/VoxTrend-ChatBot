import { io } from 'socket.io-client'

const socket = io('http://localhost:3001', {
  autoConnect: false,
})

socket.on('connect', () => {
  const clientId = localStorage.getItem('vox_client_id')
  if (clientId) {
    socket.emit('join_client_room', { clientId })
  }
})

export default socket