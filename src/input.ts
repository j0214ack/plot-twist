import type { PlayerInput } from "./game/simulation";

export class KeyboardInput {
  private readonly pressed = new Set<string>();
  private dashQueued = false;

  constructor() {
    window.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      this.pressed.add(event.code);
      if (event.code === "Space") {
        event.preventDefault();
        this.dashQueued = true;
      }
    });
    window.addEventListener("keyup", (event) => this.pressed.delete(event.code));
    window.addEventListener("blur", () => this.pressed.clear());
  }

  snapshot(): PlayerInput {
    const input: PlayerInput = {
      moveX:
        Number(this.pressed.has("KeyD") || this.pressed.has("ArrowRight")) -
        Number(this.pressed.has("KeyA") || this.pressed.has("ArrowLeft")),
      moveZ:
        Number(this.pressed.has("KeyS") || this.pressed.has("ArrowDown")) -
        Number(this.pressed.has("KeyW") || this.pressed.has("ArrowUp")),
      dash: this.dashQueued,
    };
    this.dashQueued = false;
    return input;
  }
}
