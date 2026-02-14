/**
 * Notification Triggers
 * Helper functions to create notifications when events happen
 */

import { createNotification, NOTIFICATION_TYPES } from './notificationUtils';

/**
 * Notify customer when agent accepts their errand
 */
export const notifyErrandAccepted = async (
  customerId,
  agentName,
  errandDescription,
  errandId
) => {
  await createNotification({
    userId: customerId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.ERRAND_ACCEPTED,
    title: '✅ Errand Accepted!',
    message: `${agentName} accepted your errand: "${errandDescription.substring(
      0,
      40
    )}..."`,
    link: null,
  });
};

/**
 * Notify customer when agent completes errand (uploads receipt)
 */
export const notifyErrandCompleted = async (
  customerId,
  agentName,
  errandDescription,
  errandId
) => {
  await createNotification({
    userId: customerId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.ERRAND_COMPLETED,
    title: '🎉 Errand Completed!',
    message: `${agentName} completed your errand and uploaded the receipt.`,
    link: null,
  });
};

/**
 * Notify agent when customer cancels errand
 */
export const notifyErrandCancelled = async (
  agentId,
  customerName,
  errandDescription,
  errandId,
  reason
) => {
  await createNotification({
    userId: agentId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.ERRAND_CANCELLED,
    title: '❌ Errand Cancelled',
    message: `${customerName} cancelled the errand: "${errandDescription.substring(
      0,
      40
    )}..." Reason: ${reason}`,
    link: null,
  });
};

/**
 * Notify agent when they receive a rating
 */
export const notifyAgentRated = async (
  agentId,
  customerName,
  rating,
  errandDescription,
  errandId
) => {
  const stars = '⭐'.repeat(rating);
  await createNotification({
    userId: agentId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.RATING_RECEIVED,
    title: `⭐ You received a ${rating}-star rating!`,
    message: `${customerName} rated you ${stars} for "${errandDescription.substring(
      0,
      30
    )}..."`,
    link: null,
  });
};

/**
 * Notify customer when they receive a rating
 */
export const notifyCustomerRated = async (
  customerId,
  agentName,
  rating,
  errandDescription,
  errandId
) => {
  const stars = '⭐'.repeat(rating);
  await createNotification({
    userId: customerId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.RATING_RECEIVED,
    title: `⭐ You received a ${rating}-star rating!`,
    message: `${agentName} rated you ${stars} for "${errandDescription.substring(
      0,
      30
    )}..."`,
    link: null,
  });
};

/**
 * Notify when new message in chat
 */
export const notifyNewMessage = async (
  recipientId,
  senderName,
  messagePreview,
  errandId
) => {
  await createNotification({
    userId: recipientId,
    errandId: errandId,
    type: NOTIFICATION_TYPES.NEW_MESSAGE,
    title: '💬 New Message',
    message: `${senderName}: ${messagePreview.substring(0, 50)}...`,
    link: null,
  });
};
