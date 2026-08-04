const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export const createRecurrence = (startDate = '') => ({
  frequency: 'WEEKLY',
  interval: 1,
  weekdays: startDate ? [(new Date(`${startDate}T00:00:00`).getDay() + 6) % 7] : [],
  monthly_mode: 'DAY_OF_MONTH',
  day_of_month: startDate ? Number(startDate.slice(-2)) : 1,
  week_ordinal: 1,
  weekday: startDate ? (new Date(`${startDate}T00:00:00`).getDay() + 6) % 7 : 0,
  end_type: 'NEVER',
  end_date: null,
  max_occurrences: null,
});

export const recurrencePresets = startDate => {
  const base = createRecurrence(startDate);
  const weekday = base.weekdays[0];
  const lastDay = startDate ? new Date(Number(startDate.slice(0, 4)), Number(startDate.slice(5, 7)), 0).getDate() : 31;
  const ordinal = startDate ? Math.ceil(Number(startDate.slice(-2)) / 7) : 1;
  return {
    daily: { ...base, frequency: 'DAILY' },
    weekdays: { ...base, frequency: 'WEEKLY', weekdays: [0, 1, 2, 3, 4] },
    weekly: { ...base, frequency: 'WEEKLY', weekdays: [weekday] },
    biweekly: { ...base, frequency: 'WEEKLY', interval: 2, weekdays: [weekday] },
    monthly: { ...base, frequency: 'MONTHLY', day_of_month: Number(startDate?.slice(-2)) || 1 },
    monthlyWeekday: { ...base, frequency: 'MONTHLY', monthly_mode: 'NTH_WEEKDAY', week_ordinal: Number(startDate?.slice(-2)) > lastDay - 7 ? 5 : ordinal, weekday },
    yearly: { ...base, frequency: 'YEARLY' },
  };
};

export const isValidRecurrence = rule => Boolean(rule)
  && Number(rule.interval) >= 1
  && (rule.frequency !== 'WEEKLY' || rule.weekdays?.length)
  && (rule.end_type !== 'ON_DATE' || rule.end_date)
  && (rule.end_type !== 'AFTER_COUNT' || Number(rule.max_occurrences) >= 1);

export const recurrenceLabel = rule => {
  if (!rule) return '반복 안 함';
  const every = rule.interval > 1 ? `${rule.interval}` : '';
  const unit = { DAILY: '일', WEEKLY: '주', MONTHLY: '개월', YEARLY: '년' }[rule.frequency];
  const days = rule.frequency === 'WEEKLY' ? ` · ${rule.weekdays.map(day => WEEKDAYS[day]).join(', ')}` : '';
  const monthly = rule.frequency === 'MONTHLY' && rule.monthly_mode === 'NTH_WEEKDAY'
    ? ` · 매월 ${rule.week_ordinal === 5 ? '마지막' : `${rule.week_ordinal}번째`} ${WEEKDAYS[rule.weekday]}요일`
    : '';
  const end = rule.end_type === 'ON_DATE' ? ` · ${rule.end_date}까지` : rule.end_type === 'AFTER_COUNT' ? ` · ${rule.max_occurrences}회` : ' · 종료 없음';
  return `${every}${unit}마다${days}${monthly}${end}`;
};

export { WEEKDAYS };
