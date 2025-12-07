export function calculateTrialDaysRemaining(
  trialEndsAt: Date | string | null | undefined
): number | null {
  if (!trialEndsAt) {
    return null;
  }
  const trialEnd =
    trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (isNaN(trialEnd.getTime())) {
    return null;
  }
  const now = new Date();
  const nowUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const trialEndUTC = new Date(
    Date.UTC(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate())
  );
  const diffTime = trialEndUTC.getTime() - nowUTC.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
