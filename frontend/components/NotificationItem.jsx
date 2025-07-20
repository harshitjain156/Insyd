import React from 'react';

const typeIcons = {
  follow: '👥',
  like: '❤️',
  comment: '💬',
  mention: '🔗',
};

export default function NotificationItem({ notification, markAsRead, formatTime }) {
  return (
    <div
      className={`relative p-4 rounded-lg border transition cursor-pointer shadow-sm mb-1
        ${notification.read_at
          ? 'bg-gray-50 border-gray-200'
          : 'bg-blue-50 border-blue-400 border-l-4'}
        hover:shadow-md hover:bg-blue-100/60
      `}
      onClick={() => !notification.read_at && markAsRead(notification.id)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold
              ${notification.type_name === 'follow' ? 'bg-green-100 text-green-700' :
                notification.type_name === 'like' ? 'bg-red-100 text-red-700' :
                notification.type_name === 'comment' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'}
            `}>
              {typeIcons[notification.type_name] || '🔔'}
            </span>
            <h3 className="font-semibold text-gray-900 text-base">
              {notification.title}
            </h3>
          </div>
          <p className="text-gray-700 mb-1">
            {notification.message}
          </p>
          <div className="flex items-center mt-1 text-xs text-gray-400 gap-2">
            <span className={`px-2 py-1 rounded font-medium capitalize
              ${notification.type_name === 'follow' ? 'bg-green-50 text-green-700' :
                notification.type_name === 'like' ? 'bg-red-50 text-red-700' :
                notification.type_name === 'comment' ? 'bg-blue-50 text-blue-700' :
                'bg-purple-50 text-purple-700'}
            `}>
              {notification.type_name}
            </span>
            <span>{formatTime(notification.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center ml-4">
          {!notification.read_at && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
      {!notification.read_at && (
        <button
          onClick={e => {
            e.stopPropagation();
            markAsRead(notification.id);
          }}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
        >
          Mark as read
        </button>
      )}
    </div>
  );
} 