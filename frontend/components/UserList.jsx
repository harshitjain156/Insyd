import React from 'react';

export default function UserList({ users, selectedUser, setSelectedUser }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-green-700 flex items-center gap-2">
        <span className="inline-block w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-500 mr-2">👤</span>
        Select User
      </h2>
      <hr className="mb-4 border-green-100" />
      <div className="space-y-3">
        {Array.isArray(users) && users.map(user => (
          <button
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`w-full flex items-center gap-3 p-3 text-left rounded-lg border transition font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400
              ${selectedUser?.id === user.id
                ? 'bg-green-50 border-green-500 text-green-900 ring-2 ring-green-200'
                : 'bg-gray-50 border-gray-200 hover:bg-green-100 hover:border-green-400 text-gray-800'}
            `}
          >
            <span className="inline-block w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
              {user.username?.[0]?.toUpperCase() || '?'}
            </span>
            <div>
              <div>{user.username}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 