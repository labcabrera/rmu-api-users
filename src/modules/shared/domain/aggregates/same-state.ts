/**
 * True when two snapshots of an aggregate's props hold the same values, ignoring `updatedAt` (which every change
 * touches). A PATCH that changes nothing returns the aggregate as it is: no write, no new version and no event.
 */
export function sameState(before: object, after: object): boolean {
  return canonical(before) === canonical(after);
}

function canonical(props: object): string {
  return JSON.stringify(props, (key, value: unknown) => {
    if (key === 'updatedAt') return undefined;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
    // Same keys in the same order, whatever the class or the order in which the fields were set.
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries);
  });
}
