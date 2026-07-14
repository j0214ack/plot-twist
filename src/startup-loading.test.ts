import { describe, expect, it, vi } from "vitest";
import {
  DomStartupLoadingView,
  StartupLoadingController,
  type StartupLoadingView,
} from "./startup-loading";

describe("StartupLoadingController", () => {
  const view = (): StartupLoadingView => ({ dismiss: vi.fn() });

  // Spec: design.md LOAD-2; session and first frame may settle in either order.
  it("dismisses only after both session bootstrap and the first world frame settle", () => {
    const loadingView = view();
    const loading = new StartupLoadingController(loadingView);

    loading.markWorldRendered();
    expect(loadingView.dismiss).not.toHaveBeenCalled();

    loading.markSessionSettled();
    expect(loadingView.dismiss).toHaveBeenCalledOnce();

    loading.markWorldRendered();
    loading.markSessionSettled();
    expect(loadingView.dismiss).toHaveBeenCalledOnce();
  });

  // Spec: design.md LOAD-2; a fast session must still wait for the world frame.
  it("also waits when the session settles before the first world frame", () => {
    const loadingView = view();
    const loading = new StartupLoadingController(loadingView);

    loading.markSessionSettled();
    expect(loadingView.dismiss).not.toHaveBeenCalled();

    loading.markWorldRendered();
    expect(loadingView.dismiss).toHaveBeenCalledOnce();
  });

  // Spec: design.md LOAD-5; a dismissed startup layer is hidden and no longer interactive.
  it("marks the loading element complete and hidden for assistive technology", () => {
    const add = vi.fn();
    const setAttribute = vi.fn();
    const element = { classList: { add }, setAttribute } as unknown as HTMLElement;
    const loadingView = new DomStartupLoadingView(element);

    loadingView.dismiss();

    expect(add).toHaveBeenCalledWith("is-complete");
    expect(setAttribute).toHaveBeenCalledWith("aria-hidden", "true");
  });
});
