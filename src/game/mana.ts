import { clamp } from "./math";

export class ManaPool {
  private value: number;

  constructor(
    readonly maximum = 100,
    private readonly recoveryPerSecond = 5,
  ) {
    this.value = maximum;
  }

  get current(): number {
    return this.value;
  }

  spend(requested: number, minimumRatio = 0): { spent: number; ratio: number } {
    if (requested <= 0) return { spent: 0, ratio: 1 };

    const ratio = clamp(this.value / requested, 0, 1);
    if (ratio < minimumRatio) return { spent: 0, ratio: 0 };

    const spent = Math.min(this.value, requested);
    this.value -= spent;
    return { spent, ratio };
  }

  update(deltaSeconds: number): void {
    this.value = Math.min(this.maximum, this.value + this.recoveryPerSecond * deltaSeconds);
  }

  reset(): void {
    this.value = this.maximum;
  }
}
