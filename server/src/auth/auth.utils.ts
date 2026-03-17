const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function ttlToMilliseconds(value: string) {
  const match = /^(?<amount>\d+)(?<unit>[smhd])$/.exec(value);

  if (!match?.groups) {
    throw new Error(`Unsupported TTL value: ${value}`);
  }

  return Number(match.groups.amount) * UNIT_TO_MS[match.groups.unit];
}
