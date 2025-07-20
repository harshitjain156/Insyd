import React from 'react';
import NotificationItem from './NotificationItem';

export default function NotificationsPanel({ selectedUser, notifications, markAsRead, formatTime }) {
  if (!selectedUser) return null;
  return (
    <div className="mt-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-purple-700 flex items-center gap-2">
        <span className="inline-block w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 mr-2">🔔</span>
        Notifications for {selectedUser.username}
      </h2>
      <hr className="mb-4 border-purple-100" />
      {notifications.length === 0 ? (
        <p className="text-gray-400 text-center py-8 italic">No notifications yet</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              markAsRead={markAsRead}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
} 