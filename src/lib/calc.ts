
export type CalcInput = {
  basic: number;
  fixed: number;
  variable: number;
  variablePercent: number;
  otAverage?: number;
  otPercent?: number;
  commitments: number;
  dsr: number;
  annualRate: number;
  years: number;
  margin: number;
};

export function calculate(input: CalcInput) {
  const basic = Math.max(0, input.basic);
  const fixed = Math.max(0, input.fixed);

  const variableIncome =
    Math.max(0, input.variable) * input.variablePercent / 100;

  const otAverage = Math.max(0, input.otAverage || 0);
  const otPercent = Math.min(100, Math.max(0, input.otPercent || 0));

  const recognizedOt = otAverage * otPercent / 100;

  const income = basic + fixed + variableIncome + recognizedOt;

  const maxInstallment = Math.max(
    0,
    income * input.dsr / 100 - Math.max(0, input.commitments)
  );

  const monthlyRate = input.annualRate / 1200;
  const months = input.years * 12;

  const factor = monthlyRate === 0
    ? 1 / months
    : monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));

  const maxFinancing = factor > 0
    ? maxInstallment / factor
    : 0;

  const maxPropertyPrice = input.margin > 0
    ? maxFinancing / (input.margin / 100)
    : 0;

  return {
    income,
    otAverage,
    recognizedOt,
    maxInstallment,
    maxFinancing,
    maxPropertyPrice,
    factor
  };
}

export function installment(
  price: number,
  margin: number,
  factor: number
) {
  return price * margin / 100 * factor;
}

export function money(value: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}
