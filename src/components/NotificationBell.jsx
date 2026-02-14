/**
 * NotificationBell Component
 * Shows notification icon with unread count and dropdown
 */

import { useState, useEffect, useRef } from 'react';
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
} from '../utils/notificationUtils';

export default function NotificationBell({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();

      // Poll for new notifications every 10 seconds
      const interval = setInterval(loadNotifications, 10000);

      return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;

    const unread = await getUnreadNotifications(currentUser.id);
    const all = await getAllNotifications(currentUser.id);

    setUnreadCount(unread.length);
    setNotifications(all);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
      loadNotifications();
    }

    // Could add navigation here if notification has a link
    if (notification.link) {
      // Navigate to link (implement based on your routing)
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(currentUser.id);
    loadNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'errand_accepted':
        return '✅';
      case 'errand_completed':
        return '🎉';
      case 'errand_cancelled':
        return '❌';
      case 'receipt_uploaded':
        return '📸';
      case 'rating_received':
        return '⭐';
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          marginRight: '10px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            width: '350px',
            maxWidth: '90vw',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4CAF50',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '400px',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#999',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: notification.is_read ? 'white' : '#f0f7ff',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#f5f5f5')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notification.is_read
                      ? 'white'
                      : '#f0f7ff')
                  }
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: notification.is_read ? 'normal' : 'bold',
                          fontSize: '14px',
                          marginBottom: '4px',
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#666',
                          marginBottom: '4px',
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#999',
                        }}
                      >
                        {getTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          background: '#4CAF50',
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: '8px',
                        }}
                      />
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
