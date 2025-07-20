import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(selectedUser, setNotifications) {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      // Optionally handle connection
    });

    socketRef.current.on('disconnect', () => {
      // Optionally handle disconnection
    });

    socketRef.current.on('newNotification', (notification) => {
      if (selectedUser && notification.recipient_id === selectedUser.id) {
        setNotifications(prev => [notification, ...prev]);
      }
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedUser, setNotifications]);

  useEffect(() => {
    if (selectedUser && socketRef.current) {
      socketRef.current.emit('join', selectedUser.id);
    }
  }, [selectedUser]);

  return socketRef.current;
} 