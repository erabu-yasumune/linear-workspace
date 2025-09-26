import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 現在の日付を取得（時刻を00:00:00に設定）
 */
export function getToday(): dayjs.Dayjs {
  return dayjs().startOf("day");
}

/**
 * 今日の終わりを取得（23:59:59.999）
 */
export function getEndOfToday(): dayjs.Dayjs {
  return dayjs().endOf("day");
}

/**
 * 文字列やDateオブジェクトからdayjsオブジェクトを作成
 */
export function parseDate(date: string | Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(date);
}

/**
 * ISO文字列を返す
 */
export function toISOString(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).toISOString();
}

/**
 * 日付を MM/DD 形式でフォーマット
 */
export function formatDateShort(date: string | Date | dayjs.Dayjs): string {
  const d = dayjs(date);
  return `${d.month() + 1}/${d.date()}`;
}

/**
 * 2つの日付の差を日数で取得
 */
export function getDaysDiff(
  start: string | Date | dayjs.Dayjs,
  end: string | Date | dayjs.Dayjs,
): number {
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  return Math.ceil(endDate.diff(startDate, "day", true));
}

/**
 * 日付が今日かどうかをチェック
 */
export function isToday(date: string | Date | dayjs.Dayjs): boolean {
  return dayjs(date).isSame(dayjs(), "day");
}

/**
 * 日付が週末かどうかをチェック
 */
export function isWeekend(date: string | Date | dayjs.Dayjs): boolean {
  const day = dayjs(date).day();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * 日付の範囲から最小日付を取得
 */
export function getMinDate(
  dates: (string | Date | dayjs.Dayjs | null | undefined)[],
): dayjs.Dayjs {
  const validDates = dates.filter(Boolean).map((date) => dayjs(date!));
  if (validDates.length === 0) {
    return getToday();
  }

  let minDate = validDates[0];
  for (let i = 1; i < validDates.length; i++) {
    if (validDates[i].isBefore(minDate)) {
      minDate = validDates[i];
    }
  }
  return minDate;
}

/**
 * 日付の範囲から最大日付を取得
 */
export function getMaxDate(
  dates: (string | Date | dayjs.Dayjs | null | undefined)[],
): dayjs.Dayjs {
  const validDates = dates.filter(Boolean).map((date) => dayjs(date!));
  if (validDates.length === 0) {
    return getToday();
  }

  let maxDate = validDates[0];
  for (let i = 1; i < validDates.length; i++) {
    if (validDates[i].isAfter(maxDate)) {
      maxDate = validDates[i];
    }
  }
  return maxDate;
}

/**
 * 日付に日数を加算
 */
export function addDays(
  date: string | Date | dayjs.Dayjs,
  days: number,
): dayjs.Dayjs {
  return dayjs(date).add(days, "day");
}

/**
 * 日付から日数を減算
 */
export function subtractDays(
  date: string | Date | dayjs.Dayjs,
  days: number,
): dayjs.Dayjs {
  return dayjs(date).subtract(days, "day");
}

/**
 * 日付配列から日付グリッドを生成
 */
export function generateDateGrid(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
): dayjs.Dayjs[] {
  const days: dayjs.Dayjs[] = [];
  let current = startDate.clone();

  while (current.isBefore(endDate) || current.isSame(endDate)) {
    days.push(current.clone());
    current = current.add(1, "day");
  }

  return days;
}
