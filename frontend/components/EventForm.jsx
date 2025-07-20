import React from 'react';
import EventFormFields from './EventFormFields';

export default function EventForm({ users, eventForm, setEventForm, createEvent }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-blue-700 flex items-center gap-2">
        <span className="inline-block w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mr-2">+</span>
        Create Event
      </h2>
      <hr className="mb-4 border-blue-100" />
      <form onSubmit={createEvent} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Event Type:</label>
          <select 
            value={eventForm.type} 
            onChange={(e) => setEventForm({
              ...eventForm, 
              type: e.target.value,
              actor_id: '',
              target_id: '',
              data: {}
            })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition mb-1"
          >
            <option value="follow">Follow</option>
            <option value="like">Like</option>
            <option value="comment">Comment</option>
            <option value="mention">Mention</option>
          </select>
          <span className="text-xs text-gray-400">Choose the type of event to create.</span>
        </div>
        <EventFormFields
          eventType={eventForm.type}
          eventForm={eventForm}
          setEventForm={setEventForm}
          users={users}
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow"
        >
          Create Event
        </button>
      </form>
    </div>
  );
} 