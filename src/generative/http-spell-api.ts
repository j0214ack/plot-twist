import type { SpellApiClient } from "./generative-spell-controller";
import type { SpellBundle, SpellCompileRequest } from "./types";

interface SpellApiResponse {
  bundle?: SpellBundle;
  error?: string;
}

export class HttpSpellApiClient implements SpellApiClient {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async compile(request: SpellCompileRequest): Promise<SpellBundle> {
    const response = await this.fetcher.call(globalThis, "/api/spells", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    const payload = (await response.json()) as SpellApiResponse;

    if (!response.ok) {
      throw new Error(payload.error || `Spell compiler failed with HTTP ${response.status}`);
    }
    if (!payload.bundle) {
      throw new Error("Spell compiler returned no bundle");
    }

    return payload.bundle;
  }
}
