export const calculateTrend = (values: number[]): 'rising' | 'falling' | 'steady' => {
  if (values.length < 3) return 'steady';

  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;

  if (change > 10) return 'rising';
  if (change < -10) return 'falling';
  return 'steady';
};

export const calculateRateOfChange = (values: number[], minutesPerReading: number = 5): number => {
  if (values.length < 2) return 0;

  const first = values[0];
  const last = values[values.length - 1];
  const timeSpan = (values.length - 1) * minutesPerReading;

  return (last - first) / timeSpan;
};
