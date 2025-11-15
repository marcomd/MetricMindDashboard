// Date formatting utilities for consistent dd/mm/yyyy format across the project

/**
 * Format a date object or ISO string to dd/mm/yyyy format
 * @param date - Date object or ISO date string
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date: Date | string | null | undefined): string => {
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
 * @param dateStr - Date string in dd/mm/yyyy format
 * @returns Date string in yyyy-mm-dd format
 */
export const toISOFormat = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Convert yyyy-mm-dd format to dd/mm/yyyy
 * @param isoStr - Date string in yyyy-mm-dd format
 * @returns Date string in dd/mm/yyyy format
 */
export const fromISOFormat = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return '';
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Add months to a date string in yyyy-mm-dd format
 * @param isoDateStr - Date string in yyyy-mm-dd format
 * @param months - Number of months to add
 * @returns New date string in yyyy-mm-dd format
 */
export const addMonths = (isoDateStr: string | null | undefined, months: number): string => {
  if (!isoDateStr) return '';
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date in yyyy-mm-dd format
 * @returns Today's date in yyyy-mm-dd format
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format a month string (yyyy-mm) to readable format (Month yyyy)
 * @param monthStr - Month string in yyyy-mm format
 * @returns Formatted month string
 */
export const formatMonth = (monthStr: string | null | undefined): string => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
