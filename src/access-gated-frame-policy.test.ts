import { describe, expect, it } from "vitest";
import { resolveAccessGatedFramePolicy } from "./access-gated-frame-policy";

describe("access-gated frame policy", () => {
  // Spec: Decision 0005 PUB-11; the access form must not compete with a live 3D game.
  it("renders one bootstrap frame without advancing the world before the session is ready", () => {
    expect(
      resolveAccessGatedFramePolicy({
        sessionReady: false,
        initialWorldFrameRendered: false,
      }),
    ).toEqual({
      advanceWorld: false,
      renderWorld: true,
      updateHud: true,
    });

    expect(
      resolveAccessGatedFramePolicy({
        sessionReady: false,
        initialWorldFrameRendered: true,
      }),
    ).toEqual({
      advanceWorld: false,
      renderWorld: false,
      updateHud: false,
    });
  });

  // Spec: Decision 0005 PUB-11; unlocking returns to the normal playable loop.
  it("resumes simulation, rendering and HUD updates after the session is ready", () => {
    expect(
      resolveAccessGatedFramePolicy({
        sessionReady: true,
        initialWorldFrameRendered: true,
      }),
    ).toEqual({
      advanceWorld: true,
      renderWorld: true,
      updateHud: true,
    });
  });
});
