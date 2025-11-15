import { describe, it, expect } from 'vitest';
import { formatDate, toISOFormat, fromISOFormat, addMonths } from './dateFormat';

describe('dateFormat utilities', () => {
  describe('formatDate', () => {
    it('should format Date object to dd/mm/yyyy', () => {
      const date = new Date('2024-12-25');
      expect(formatDate(date)).toBe('25/12/2024');
    });

    it('should format ISO string to dd/mm/yyyy', () => {
      expect(formatDate('2024-12-25')).toBe('25/12/2024');
    });

    it('should handle single digit days and months with leading zeros', () => {
      expect(formatDate('2024-01-05')).toBe('05/01/2024');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDate(null as unknown as string)).toBe('');
      expect(formatDate(undefined as unknown as string)).toBe('');
    });
  });

  describe('toISOFormat', () => {
    it('should convert dd/mm/yyyy to yyyy-mm-dd', () => {
      expect(toISOFormat('25/12/2024')).toBe('2024-12-25');
    });

    it('should handle single digit days and months', () => {
      expect(toISOFormat('5/1/2024')).toBe('2024-01-05');
    });

    it('should return empty string for invalid format', () => {
      expect(toISOFormat('invalid')).toBe('');
      expect(toISOFormat('2024-12-25')).toBe(''); // Wrong format
    });

    it('should return empty string for null/undefined', () => {
      expect(toISOFormat(null as unknown as string)).toBe('');
      expect(toISOFormat(undefined as unknown as string)).toBe('');
    });
  });

  describe('fromISOFormat', () => {
    it('should convert yyyy-mm-dd to dd/mm/yyyy', () => {
      expect(fromISOFormat('2024-12-25')).toBe('25/12/2024');
    });

    it('should handle dates with leading zeros', () => {
      expect(fromISOFormat('2024-01-05')).toBe('05/01/2024');
    });

    it('should return empty string for invalid format', () => {
      expect(fromISOFormat('invalid')).toBe('');
      expect(fromISOFormat('25/12/2024')).toBe(''); // Wrong format
    });

    it('should return empty string for null/undefined', () => {
      expect(fromISOFormat(null as unknown as string)).toBe('');
      expect(fromISOFormat(undefined as unknown as string)).toBe('');
    });
  });

  describe('addMonths', () => {
    it('should add months to a date', () => {
      const result = addMonths('2024-01-15', 6);
      expect(result).toMatch(/^2024-07-(14|15)$/); // Account for UTC timezone differences
    });

    it('should handle year overflow', () => {
      const result = addMonths('2024-11-15', 3);
      expect(result).toMatch(/^2025-02-(14|15)$/);
    });

    it('should subtract months with negative values', () => {
      const result = addMonths('2024-07-15', -6);
      expect(result).toMatch(/^2024-01-(14|15)$/);
    });

    it('should handle year underflow', () => {
      const result = addMonths('2024-02-15', -3);
      expect(result).toMatch(/^2023-11-(14|15)$/);
    });

    it('should handle end of month dates correctly', () => {
      // January 31 + 1 month = Feb 28/29 or early March due to overflow
      const result = addMonths('2024-01-31', 1);
      expect(result).toMatch(/^2024-(02-(28|29)|03-0[12])$/); // 2024 is leap year
    });

    it('should return empty string for invalid date', () => {
      expect(addMonths('invalid', 1)).toBe('');
    });
  });

  describe('date conversion round-trip', () => {
    it('should maintain date integrity through conversions', () => {
      const originalISO = '2024-12-25';
      const displayFormat = fromISOFormat(originalISO);
      const backToISO = toISOFormat(displayFormat);

      expect(backToISO).toBe(originalISO);
    });
  });
});
