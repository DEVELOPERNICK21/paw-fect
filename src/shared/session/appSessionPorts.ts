/**
 * Session snapshot read by command stores without importing other feature stores.
 * Wired from auth + subscription in `registerAppSessionPortSync` (composition root).
 */
export type AppSessionSnapshot = {
  getUserId: () => string | null;
  getMaxPets: () => number;
};

const defaultSnapshot: AppSessionSnapshot = {
  getUserId: () => null,
  /** Matches conservative free-tier default until subscription store hydrates. */
  getMaxPets: () => 1,
};

let snapshot: AppSessionSnapshot = defaultSnapshot;

export function replaceAppSessionSnapshot(next: AppSessionSnapshot): void {
  snapshot = next;
}

export function getAppSessionUserId(): string | null {
  return snapshot.getUserId();
}

export function getAppSessionMaxPets(): number {
  return snapshot.getMaxPets();
}
