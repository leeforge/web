import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export function validateTime(date: string | number | Date | Dayjs | null | undefined): boolean {
  if (!date)
    return false;
  try {
    const instance = dayjs(date);
    if (instance.isValid()) {
      return instance.year() !== 1 && !instance.format('YYYY-MM-DD').startsWith('0001');
    }
    return false;
  }
  catch {
    return false;
  }
}
