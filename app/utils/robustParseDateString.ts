function robustParseDateString(dueDateValue: any): Date | null {
  if (!dueDateValue) return null;
  if (dueDateValue instanceof Date && !isNaN(dueDateValue.getTime())) return dueDateValue;
  if (typeof dueDateValue === 'string') {
    const parts = dueDateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    if (parts) {
      const [year, month, day, hours, minutes, seconds] = dueDateValue.split(/[- :]/).map(Number);
      const d = new Date(year, month - 1, day, hours, minutes, seconds);
      return isNaN(d.getTime()) ? null : d;
    }
    const isoDateString = dueDateValue.includes(' ') ? dueDateValue.replace(' ', 'T') : dueDateValue;
    const dSafe = new Date(isoDateString);
    return isNaN(dSafe.getTime()) ? null : dSafe;
  }
  return null;
}

export default robustParseDateString; 