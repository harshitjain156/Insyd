const API_BASE = 'http://localhost:5000/api';

export async function fetchUsers() {
  const response = await fetch(`${API_BASE}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function fetchNotifications(userId) {
  const response = await fetch(`${API_BASE}/notifications/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function createEvent(eventData) {
  const response = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error('Failed to create event');
  return response.json();
}

export async function markAsRead(notificationId) {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Failed to mark notification as read');
  return response.json();
} 