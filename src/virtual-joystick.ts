import type { PlayerInput } from "./game/simulation";

export interface VirtualJoystickView {
  active: boolean;
  offsetX: number;
  offsetY: number;
}

export class VirtualJoystickModel {
  private pointerId: number | undefined;
  private centerX = 0;
  private centerY = 0;
  private moveX = 0;
  private moveZ = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private readonly radius: number,
    private readonly deadZone = 0.12,
  ) {
    if (radius <= 0) throw new Error("Joystick radius must be positive");
    if (deadZone < 0 || deadZone >= 1) {
      throw new Error("Joystick dead zone must be between 0 and 1");
    }
  }

  engage(pointerId: number, centerX: number, centerY: number): boolean {
    if (this.pointerId !== undefined) return false;
    this.pointerId = pointerId;
    this.centerX = centerX;
    this.centerY = centerY;
    this.clearVector();
    return true;
  }

  move(pointerId: number, clientX: number, clientY: number): void {
    if (pointerId !== this.pointerId) return;

    const deltaX = clientX - this.centerX;
    const deltaY = clientY - this.centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const visualScale = distance > this.radius ? this.radius / distance : 1;
    this.offsetX = deltaX * visualScale;
    this.offsetY = deltaY * visualScale;

    const rawMagnitude = Math.min(1, distance / this.radius);
    if (rawMagnitude <= this.deadZone || distance === 0) {
      this.moveX = 0;
      this.moveZ = 0;
      return;
    }

    const magnitude = (rawMagnitude - this.deadZone) / (1 - this.deadZone);
    this.moveX = (deltaX / distance) * magnitude;
    this.moveZ = (deltaY / distance) * magnitude;
  }

  release(pointerId: number): boolean {
    if (pointerId !== this.pointerId) return false;
    this.reset();
    return true;
  }

  reset(): void {
    this.pointerId = undefined;
    this.clearVector();
  }

  snapshot(): PlayerInput {
    return { moveX: this.moveX, moveZ: this.moveZ, dash: false };
  }

  view(): VirtualJoystickView {
    return {
      active: this.pointerId !== undefined,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
    };
  }

  private clearVector(): void {
    this.moveX = 0;
    this.moveZ = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}

export class VirtualJoystickInput {
  private readonly model: VirtualJoystickModel;
  private enabled = true;

  constructor(
    private readonly surface: HTMLElement,
    private readonly knob: HTMLElement,
    radius = 46,
  ) {
    this.model = new VirtualJoystickModel(radius);
    surface.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    surface.addEventListener("pointermove", (event) => this.onPointerMove(event));
    surface.addEventListener("pointerup", (event) => this.finishPointer(event));
    surface.addEventListener("pointercancel", (event) => this.finishPointer(event));
    surface.addEventListener("lostpointercapture", () => {
      this.model.reset();
      this.syncView();
    });
    window.addEventListener("blur", () => {
      this.model.reset();
      this.syncView();
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.surface.classList.toggle("is-disabled", !enabled);
    this.surface.setAttribute("aria-disabled", String(!enabled));
    if (!enabled) {
      this.model.reset();
      this.syncView();
    }
  }

  snapshot(): PlayerInput {
    return this.enabled
      ? this.model.snapshot()
      : { moveX: 0, moveZ: 0, dash: false };
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.enabled) return;
    event.preventDefault();
    const bounds = this.surface.getBoundingClientRect();
    if (!this.model.engage(event.pointerId, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)) {
      return;
    }
    this.surface.setPointerCapture(event.pointerId);
    this.model.move(event.pointerId, event.clientX, event.clientY);
    this.syncView();
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.enabled) return;
    this.model.move(event.pointerId, event.clientX, event.clientY);
    this.syncView();
  }

  private finishPointer(event: PointerEvent): void {
    if (!this.model.release(event.pointerId)) return;
    if (this.surface.hasPointerCapture(event.pointerId)) {
      this.surface.releasePointerCapture(event.pointerId);
    }
    this.syncView();
  }

  private syncView(): void {
    const view = this.model.view();
    this.surface.classList.toggle("is-active", view.active);
    this.knob.style.transform = `translate(${view.offsetX}px, ${view.offsetY}px)`;
  }
}
