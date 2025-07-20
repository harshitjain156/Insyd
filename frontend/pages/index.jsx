import React, { useState, useEffect } from 'react';
import EventForm from '../components/EventForm';
import UserList from '../components/UserList';
import NotificationsPanel from '../components/NotificationsPanel';
import { fetchUsers, fetchNotifications as fetchNotificationsApi, createEvent as createEventApi, markAsRead as markAsReadApi } from '../utils/api';
import { formatTime } from '../utils/utils';
import { useSocket } from '../utils/useSocket';

export default function NotificationPOC() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'follow',
    actor_id: '',
    target_id: '',
    data: {}
  });

  // Socket connection
  const socket = useSocket(selectedUser, setNotifications);

  useEffect(() => {
    if (socket) {
      setIsConnected(socket.connected);
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, [socket]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(error => console.error('Failed to fetch users:', error));
  }, []);

  // Fetch notifications when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchNotificationsApi(selectedUser.id)
        .then(setNotifications)
        .catch(error => console.error('Failed to fetch notifications:', error));
    }
  }, [selectedUser]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...eventForm,
        actor_id: parseInt(eventForm.actor_id),
        target_id: parseInt(eventForm.target_id),
        data: eventForm.type === 'like' || eventForm.type === 'comment' 
          ? { post_owner_id: parseInt(eventForm.target_id), ...eventForm.data }
          : eventForm.data
      };
      await createEventApi(eventData);
      setEventForm({
        type: 'follow',
        actor_id: '',
        target_id: '',
        data: {}
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsReadApi(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-blue-800 tracking-tight drop-shadow-sm">
          Insyd Notification System POC
        </h1>
        {/* Connection Status */}
        <div className="mb-6 flex justify-center">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-semibold shadow border-2 ${
            isConnected 
              ? 'bg-green-50 text-green-700 border-green-300' 
              : 'bg-red-50 text-red-700 border-red-300'
          }`}>
            <span className={`w-3 h-3 rounded-full mr-2 inline-block ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EventForm
            users={users}
            eventForm={eventForm}
            setEventForm={setEventForm}
            createEvent={handleCreateEvent}
          />
          <UserList
            users={users}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>
        <div className="mt-10">
          <NotificationsPanel
            selectedUser={selectedUser}
            notifications={notifications}
            markAsRead={handleMarkAsRead}
            formatTime={formatTime}
          />
        </div>
        {/* Instructions */}
        <div className="mt-10 bg-blue-50 p-6 rounded-xl border-l-8 border-blue-400 flex items-start gap-4 shadow">
          <span className="text-blue-400 text-3xl mt-1">ℹ️</span>
          <div>
            <h3 className="font-bold text-blue-800 mb-2 text-lg">How to test:</h3>
            <ol className="text-base text-blue-700 space-y-1 list-decimal list-inside">
              <li>Select a user to view their notifications</li>
              <li>Create events involving that user (as target)</li>
              <li>See real-time notifications appear instantly</li>
              <li>Click notifications to mark them as read</li>
              <li>Try different event types to see various notification formats</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 