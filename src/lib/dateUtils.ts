/**
 * Date utility functions for formatting timestamps in IST (Asia/Kolkata)
 */

/**
 * Formats a timestamp to IST timezone
 * @param timestamp - ISO timestamp string or Date object
 * @param options - Formatting options
 * @returns Formatted date string in IST
 */
export function formatToIST(
  timestamp: string | Date,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    format?: 'short' | 'long' | 'medium';
  } = {}
): string {
  const {
    includeTime = true,
    includeSeconds = false,
    format = 'medium'
  } = options;

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const istOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: format === 'short' ? '2-digit' : format === 'long' ? 'long' : 'short',
    day: '2-digit',
  };

  if (includeTime) {
    istOptions.hour = '2-digit';
    istOptions.minute = '2-digit';
    istOptions.hour12 = true;
    
    if (includeSeconds) {
      istOptions.second = '2-digit';
    }
  }

  return new Intl.DateTimeFormat('en-IN', istOptions).format(date);
}

/**
 * Formats timestamp for audit logs display
 * @param timestamp - ISO timestamp string
 * @returns Formatted string like "14 Oct 2025, 3:30 PM IST"
 */
export function formatAuditLogTime(timestamp: string): string {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const formatted = formatToIST(timestamp, { 
    includeTime: true, 
    includeSeconds: false,
    format: 'short'
  });
  
  return `${formatted} IST`;
}

/**
 * Formats timestamp for session activity display
 * @param timestamp - ISO timestamp string
 * @returns Formatted string like "3:30:45 PM"
 */
export function formatSessionTime(timestamp: string): string {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }

  return formatToIST(timestamp, { 
    includeTime: true, 
    includeSeconds: true,
    format: 'short'
  }).split(', ')[1]; // Get only the time part
}

/**
 * Formats date for employee last login display
 * @param timestamp - ISO timestamp string
 * @returns Formatted string like "14 Oct 2025"
 */
export function formatLastLoginDate(timestamp: string): string {
  return formatToIST(timestamp, { 
    includeTime: false,
    format: 'short'
  });
}

/**
 * Gets relative time with IST context
 * @param timestamp - ISO timestamp string
 * @returns Relative time string like "2 hours ago (IST)"
 */
export function getRelativeTimeIST(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  
  if (diffMinutes < 1) {
    relative = 'Just now';
  } else if (diffMinutes < 60) {
    relative = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    // For older dates, show the actual date
    return formatToIST(timestamp, { includeTime: false, format: 'short' });
  }

  return `${relative} (IST)`;
}

/**
 * Converts UTC timestamp to IST Date object
 * @param timestamp - ISO timestamp string
 * @returns Date object adjusted for IST
 */
export function toISTDate(timestamp: string): Date {
  const utcDate = new Date(timestamp);
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  return new Date(utcDate.getTime() + istOffset);
}

/**
 * Formats timestamp for CSV export
 * @param timestamp - ISO timestamp string
 * @returns Formatted string for CSV like "2025-10-14 15:30:00 IST"
 */
export function formatForCSV(timestamp: string): string {
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Format as YYYY-MM-DD HH:mm:ss IST
  const istDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const seconds = String(istDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;
}