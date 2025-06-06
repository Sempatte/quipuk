import { useMemo } from "react";
import { startOfMonth, endOfMonth, isSameMonth, addDays, isLastDayOfMonth } from "date-fns";

const useMonthDays = (referenceDay: Date) => useMemo(() => {
  const start = startOfMonth(referenceDay);
  const end = endOfMonth(referenceDay);
  const today = new Date();
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(new Date(d));
  if (!isSameMonth(today, referenceDay)) return days;
  const todayDate = today.getDate();
  return days.filter(day => {
    const dayDate = day.getDate();
    if (isLastDayOfMonth(today)) return dayDate <= todayDate;
    if (todayDate === end.getDate() - 1) return dayDate <= end.getDate();
    return dayDate <= Math.min(todayDate + 2, end.getDate());
  });
}, [referenceDay]);

export default useMonthDays; 