// Date formatting utilities for consistent dd/mm/yyyy format across the project

/**
 * Format a date object or ISO string to dd/mm/yyyy format
 * @param {Date|string} date - Date object or ISO date string
 * @returns {string} Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Convert dd/mm/yyyy format to yyyy-mm-dd (ISO format for HTML date inputs)
 * @param {string} dateStr - Date string in dd/mm/yyyy format
 * @returns {string} Date string in yyyy-mm-dd format
 */
export const toISOFormat = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Convert yyyy-mm-dd format to dd/mm/yyyy
 * @param {string} isoStr - Date string in yyyy-mm-dd format
 * @returns {string} Date string in dd/mm/yyyy format
 */
export const fromISOFormat = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Add months to a date string in yyyy-mm-dd format
 * @param {string} isoDateStr - Date string in yyyy-mm-dd format
 * @param {number} months - Number of months to add
 * @returns {string} New date string in yyyy-mm-dd format
 */
export const addMonths = (isoDateStr, months) => {
  if (!isoDateStr) return '';
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date in yyyy-mm-dd format
 * @returns {string} Today's date in yyyy-mm-dd format
 */
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format a month string (yyyy-mm) to readable format (Month yyyy)
 * @param {string} monthStr - Month string in yyyy-mm format
 * @returns {string} Formatted month string
 */
export const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
