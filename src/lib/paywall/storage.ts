export interface TrialStorage {
  getTrialUsed(): boolean;
  setTrialUsed(value: boolean): void;
}

class MemoryTrialStorage implements TrialStorage {
  private used = false;
  getTrialUsed() {
    return this.used;
  }
  setTrialUsed(value: boolean) {
    this.used = value;
  }
}

export function createBrowserTrialStorage(): TrialStorage {
  if (typeof window === 'undefined') {
    return new MemoryTrialStorage();
  }

  return {
    getTrialUsed() {
      try {
        return localStorage.getItem('snapshark-trial-used') === 'true';
      } catch {
        return false;
      }
    },
    setTrialUsed(value: boolean) {
      try {
        localStorage.setItem('snapshark-trial-used', value ? 'true' : 'false');
      } catch {
        // Non-fatal; storage may be unavailable.
      }
    },
  };
}

export const memoryTrialStorage = () => new MemoryTrialStorage();
