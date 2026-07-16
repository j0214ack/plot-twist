import { describe, expect, it, vi } from "vitest";
import {
  createLeaveDoorOpenPageRouteMiddleware,
  leaveDoorOpenPageRoutePlugin,
} from "./leave-door-open-page-route";

describe("Leave the Door Open canonical page route", () => {
  // Spec: ADR 0018 LDO-WEB-008.
  it("redirects the exact no-slash page path instead of falling through to the root SPA", () => {
    const middleware = createLeaveDoorOpenPageRouteMiddleware();
    const response = {
      statusCode: 200,
      headers: new Map<string, string>(),
      setHeader(name: string, value: string) {
        this.headers.set(name.toLowerCase(), value);
      },
      end: vi.fn(),
    };
    const next = vi.fn();

    middleware({ url: "/leave-the-door-open" }, response, next);

    expect(next).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(308);
    expect(response.headers.get("location")).toBe("/leave-the-door-open/");
    expect(response.end).toHaveBeenCalledOnce();
  });

  // Spec: ADR 0018 LDO-WEB-008 applies in local dev and Fly preview.
  it("installs the same canonical redirect before both Vite server fallbacks", () => {
    const plugin = leaveDoorOpenPageRoutePlugin();
    const devUse = vi.fn();
    const previewUse = vi.fn();

    (plugin.configureServer as (server: { middlewares: { use: typeof devUse } }) => void)({
      middlewares: { use: devUse },
    });
    (plugin.configurePreviewServer as (
      server: { middlewares: { use: typeof previewUse } },
    ) => void)({ middlewares: { use: previewUse } });

    expect(devUse).toHaveBeenCalledOnce();
    expect(previewUse).toHaveBeenCalledOnce();
    expect(devUse.mock.calls[0]?.[0]).toBe(previewUse.mock.calls[0]?.[0]);
  });
});
