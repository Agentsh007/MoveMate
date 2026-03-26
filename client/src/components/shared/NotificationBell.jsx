import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../../api/location.api';
import useNotificationStore from '../../store/notificationStore';
import { timeAgo } from '../../utils/formatDate';

import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, setNotifications, markRead, markAllRead } = useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationAPI.list();
        setNotifications(data.notifications, data.unread_count);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [setNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      markRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      markAllRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleMarkRead(n.id);
    }
    
    try {
      const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
      if (payload && payload.booking_id) {
        setIsOpen(false);
        navigate(`/bookings/${payload.booking_id}`);
      }
    } catch (e) {
      console.warn('Failed to parse notification payload', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full px-1 animate-pulse-dot">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-border z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-heading font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.is_read ? 'font-semibold' : ''}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
