/**
 * Formats a timestamp to show only the time (e.g., "09:47")
 * Always returns time in HH:MM format regardless of date
 */
export const formatMessageTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = new Date(timestamp);
  
  // Get time in HH:MM format
  const hours = messageDate.getHours().toString().padStart(2, '0');
  const minutes = messageDate.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  return timeString;
};

/**
 * Formats timestamp for chat list (last message time)
 * Similar to formatMessageTimestamp but optimized for sidebar display
 */
export const formatChatListTimestamp = (timestamp) => {
  return formatMessageTimestamp(timestamp);
};

/**
 * Gets the date separator label for a message
 * Returns null if no separator is needed, or a string like "Yesterday", "Nov 5", etc.
 */
export const getDateSeparator = (timestamp, prevTimestamp) => {
  if (!timestamp) return null;
  if (!prevTimestamp) {
    // First message should show date separator (but not "Today")
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Don't show separator for today's messages
    if (messageDay.getTime() === today.getTime()) {
      return null;
    }
    if (messageDay.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    if (messageDate.getFullYear() === now.getFullYear()) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[messageDate.getMonth()];
      const day = messageDate.getDate();
      return `${month} ${day}`;
    }
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const messageDate = new Date(timestamp);
  const prevDate = new Date(prevTimestamp);
  
  // Reset to midnight for comparison
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const prevDay = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
  
  // If same day, no separator needed
  if (messageDay.getTime() === prevDay.getTime()) {
    return null;
  }

  // Different day, show separator (but not "Today")
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Don't show separator for today's messages
  if (messageDay.getTime() === today.getTime()) {
    return null;
  }
  if (messageDay.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  if (messageDate.getFullYear() === now.getFullYear()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[messageDate.getMonth()];
    const day = messageDate.getDate();
    return `${month} ${day}`;
  }
  const day = messageDate.getDate().toString().padStart(2, '0');
  const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
  const year = messageDate.getFullYear();
  return `${day}-${month}-${year}`;
};

