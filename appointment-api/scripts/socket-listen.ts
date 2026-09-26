import { io } from 'socket.io-client';

const baseUrl = process.env.API_URL ?? 'http://localhost:3000';

const socket = io(baseUrl, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log(`Connected to ${baseUrl} (socket id: ${socket.id})`);
  console.log('Listening for slot.booked and slot.released…');
  console.log('Book or cancel via REST in another terminal.');
});

socket.on('slot.booked', (payload) => {
  console.log('[slot.booked]', JSON.stringify(payload));
});

socket.on('slot.released', (payload) => {
  console.log('[slot.released]', JSON.stringify(payload));
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
