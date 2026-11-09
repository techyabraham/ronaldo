const KEY = "lastBirthday";

export function readLast(): string | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && /^\d{2}-\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeLast(mmdd: string) {
  try {
    window.localStorage.setItem(KEY, mmdd);
  } catch {
    /* private mode etc. */
  }
}
