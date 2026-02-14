/**
 * Notification Utilities
 * Functions to create and manage notifications
 */

import { supabase } from '../supabaseClient';

/**
 * Create a new notification for a user
 */
export const createNotification = async ({
  userId,
  errandId,
  type,
  title,
  message,
  link,
}) => {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      errand_id: errandId,
      type: type,
      title: title,
      message: message,
      link: link || null,
    },
  ]);

  if (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Get unread notifications for a user
 */
export const getUnreadNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
};

/**
 * Get all notifications for a user (last 20)
 */
export const getAllNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all as read:', error);
  }
};

/**
 * Delete old notifications (older than 30 days)
 */
export const cleanupOldNotifications = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error cleaning up notifications:', error);
  }
};

/**
 * Notification type helpers
 */
export const NOTIFICATION_TYPES = {
  ERRAND_ACCEPTED: 'errand_accepted',
  ERRAND_COMPLETED: 'errand_completed',
  ERRAND_CANCELLED: 'errand_cancelled',
  RECEIPT_UPLOADED: 'receipt_uploaded',
  RATING_RECEIVED: 'rating_received',
  NEW_MESSAGE: 'new_message',
};
