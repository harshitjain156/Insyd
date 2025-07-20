import React from 'react';

export default function EventFormFields({ eventType, eventForm, setEventForm, users }) {
  switch (eventType) {
    case 'follow':
      return (
        <>
          <label className="block text-sm font-medium mb-1">Who is following:</label>
          <select 
            value={eventForm.actor_id} 
            onChange={(e) => setEventForm({...eventForm, actor_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Who to follow:</label>
          <select 
            value={eventForm.target_id} 
            onChange={(e) => setEventForm({...eventForm, target_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </>
      );
    case 'like':
      return (
        <>
          <label className="block text-sm font-medium mb-1">Who liked:</label>
          <select 
            value={eventForm.actor_id} 
            onChange={(e) => setEventForm({...eventForm, actor_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Whose post was liked:</label>
          <select 
            value={eventForm.target_id} 
            onChange={(e) => setEventForm({...eventForm, target_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select post owner</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}'s post</option>
            ))}
          </select>
        </>
      );
    case 'comment':
      return (
        <>
          <label className="block text-sm font-medium mb-1">Who commented:</label>
          <select 
            value={eventForm.actor_id} 
            onChange={(e) => setEventForm({...eventForm, actor_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Whose post was commented on:</label>
          <select 
            value={eventForm.target_id} 
            onChange={(e) => setEventForm({...eventForm, target_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select post owner</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}'s post</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Comment text:</label>
          <input 
            type="text"
            placeholder="Comment content"
            value={eventForm.data.comment || ''}
            onChange={(e) => setEventForm({
              ...eventForm, 
              data: { ...eventForm.data, comment: e.target.value }
            })}
            className="w-full p-2 border rounded mb-2"
          />
        </>
      );
    case 'mention':
      return (
        <>
          <label className="block text-sm font-medium mb-1">Who mentioned:</label>
          <select 
            value={eventForm.actor_id} 
            onChange={(e) => setEventForm({...eventForm, actor_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Who was mentioned:</label>
          <select 
            value={eventForm.target_id} 
            onChange={(e) => setEventForm({...eventForm, target_id: e.target.value})}
            className="w-full p-2 border rounded mb-2"
            required
          >
            <option value="">Select user</option>
            {Array.isArray(users) && users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mb-1">Context:</label>
          <input 
            type="text"
            placeholder="Context of mention"
            value={eventForm.data.context || ''}
            onChange={(e) => setEventForm({
              ...eventForm, 
              data: { ...eventForm.data, context: e.target.value }
            })}
            className="w-full p-2 border rounded mb-2"
          />
        </>
      );
    default:
      return null;
  }
} 