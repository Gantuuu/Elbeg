const orderPollInterval = 15_000;

export function getOrderPollInterval(query: { state: { error: Error | null; errorUpdatedAt: number } }) {
  const { error, errorUpdatedAt } = query.state;
  if (!error || !/exceeded D1's free tier daily row read limit/i.test(error.message)) {
    return orderPollInterval;
  }

  // Anchor to the failed request so a later render cannot move the reset to another day.
  const reset = new Date(errorUpdatedAt);
  reset.setUTCHours(24, 0, 0, 0);
  return Math.max(orderPollInterval, reset.getTime() - Date.now());
}
