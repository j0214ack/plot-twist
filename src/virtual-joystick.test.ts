import { describe, expect, it } from "vitest";
import { VirtualJoystickModel } from "./virtual-joystick";

describe("VirtualJoystickModel", () => {
  // Spec: Decision 0008 MOB-7/MOB-9.
  it("maps a pointer offset to the existing normalized PlayerInput axes", () => {
    const joystick = new VirtualJoystickModel(50, 0.15);
    expect(joystick.engage(7, 100, 100)).toBe(true);

    joystick.move(7, 125, 75);

    const input = joystick.snapshot();
    expect(input.moveX).toBeGreaterThan(0);
    expect(input.moveZ).toBeLessThan(0);
    expect(Math.hypot(input.moveX, input.moveZ)).toBeLessThanOrEqual(1);
    expect(input.dash).toBe(false);
    expect(joystick.view()).toMatchObject({ active: true });
  });

  // Spec: Decision 0008 MOB-7; a small accidental touch does not move the player.
  it("applies a dead zone and clamps both input and visual travel", () => {
    const joystick = new VirtualJoystickModel(50, 0.2);
    joystick.engage(1, 0, 0);
    joystick.move(1, 5, 4);
    expect(joystick.snapshot()).toEqual({ moveX: 0, moveZ: 0, dash: false });

    joystick.move(1, 100, 100);
    expect(Math.hypot(joystick.snapshot().moveX, joystick.snapshot().moveZ)).toBeCloseTo(1);
    const view = joystick.view();
    expect(Math.hypot(view.offsetX, view.offsetY)).toBeCloseTo(50);
  });

  // Spec: Decision 0008 MOB-7; another finger cannot steal or release the joystick.
  it("owns one pointer until the matching release", () => {
    const joystick = new VirtualJoystickModel(50);
    expect(joystick.engage(3, 10, 10)).toBe(true);
    expect(joystick.engage(4, 20, 20)).toBe(false);

    joystick.move(4, 60, 60);
    expect(joystick.snapshot()).toEqual({ moveX: 0, moveZ: 0, dash: false });
    expect(joystick.release(4)).toBe(false);
    expect(joystick.view().active).toBe(true);

    joystick.move(3, 60, 10);
    expect(joystick.snapshot().moveX).toBe(1);
    expect(joystick.release(3)).toBe(true);
    expect(joystick.snapshot()).toEqual({ moveX: 0, moveZ: 0, dash: false });
    expect(joystick.view()).toEqual({ active: false, offsetX: 0, offsetY: 0 });
  });

  // Spec: Decision 0008 MOB-7; pointer cancellation and window blur share a hard reset.
  it("resets an active gesture without requiring the pointer id", () => {
    const joystick = new VirtualJoystickModel(50);
    joystick.engage(9, 0, 0);
    joystick.move(9, -50, 0);
    expect(joystick.snapshot().moveX).toBe(-1);

    joystick.reset();

    expect(joystick.snapshot()).toEqual({ moveX: 0, moveZ: 0, dash: false });
    expect(joystick.view().active).toBe(false);
  });
});
