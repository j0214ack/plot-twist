import { randomBytes } from "node:crypto";
import type { DemoAccessOptions } from "./demo-access";

type DemoAccessEnvironment = Record<string, string | undefined>;

const validOrigin = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return (
      parsed.origin === value &&
      !parsed.username &&
      !parsed.password &&
      (parsed.protocol === "https:" || parsed.protocol === "http:")
    );
  } catch {
    return false;
  }
};

export const resolvePreviewAllowedHosts = (
  allowedOrigin: string,
  isPreview: boolean,
): string[] | undefined =>
  isPreview ? [new URL(allowedOrigin).hostname] : undefined;

export const resolveDemoAccessOptions = (
  environment: DemoAccessEnvironment,
  context: { isPreview: boolean; mode?: string },
): DemoAccessOptions => {
  const allowedOrigin =
    environment.ALLOWED_ORIGIN ||
    (context.isPreview ? "" : "http://127.0.0.1:5173");
  if (!allowedOrigin) throw new Error("ALLOWED_ORIGIN is required for public preview");
  if (!validOrigin(allowedOrigin)) {
    throw new Error("ALLOWED_ORIGIN must be a valid origin without a path or credentials");
  }

  const sessionSecret =
    environment.DEMO_SESSION_SECRET ||
    (context.isPreview ? "" : randomBytes(32).toString("base64url"));
  if (!sessionSecret) {
    throw new Error("DEMO_SESSION_SECRET is required for public preview");
  }

  return {
    allowedOrigin,
    sessionSecret,
    accessCode:
      !context.isPreview &&
      (context.mode === "ldo-local-codex" ||
        context.mode === "ldo-local-openai")
        ? undefined
        : environment.DEMO_ACCESS_CODE || undefined,
    secureCookies: context.isPreview || allowedOrigin.startsWith("https://"),
  };
};
