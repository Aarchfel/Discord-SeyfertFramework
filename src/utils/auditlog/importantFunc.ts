// IS IT FRESH??
export function isFresh(entryId: string, maxAgeMs = 10_000): boolean {
  const ts = Number((BigInt(entryId) >> 22n) + 1420070400000n);
  return Date.now() - ts < maxAgeMs;
}
