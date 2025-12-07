export const TRIAL_PERIOD_DAYS =
  parseInt(process.env.TRIAL_PERIOD_DAYS || "14", 10) || 14;

export function getTrialEndDate(): Date {
  return new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);
}

export function formatTrialPeriod(): string {
  if (TRIAL_PERIOD_DAYS === 1) {
    return "1 day";
  }
  return `${TRIAL_PERIOD_DAYS} days`;
}

export function formatTrialPeriodHyphenated(): string {
  if (TRIAL_PERIOD_DAYS === 1) {
    return "1-day";
  }
  return `${TRIAL_PERIOD_DAYS}-day`;
}
