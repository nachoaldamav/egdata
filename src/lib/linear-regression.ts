export function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, v, i) => acc + v * y[i], 0);
  const sumXX = x.reduce((acc, v) => acc + v * v, 0);

  const denom = n * sumXX - sumX * sumX;
  if (!denom) return { slope: 0, intercept: sumY / n };

  return {
    slope: (n * sumXY - sumX * sumY) / denom,
    intercept: (sumY - (sumX * (n * sumXY - sumX * sumY)) / denom) / n,
  };
}
