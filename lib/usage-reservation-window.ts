/** A send holds its reserved capacity for at most this long. Sends finish in
 * seconds; the window only matters when a worker crashes before releasing,
 * so a lost reservation cannot block an account for the rest of the month. */
export const USAGE_RESERVATION_TTL_MS = 10 * 60 * 1000;

export function activeUsageReservationSince(now = Date.now()) {
  return new Date(now - USAGE_RESERVATION_TTL_MS);
}
