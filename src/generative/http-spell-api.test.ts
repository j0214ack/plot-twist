import { describe, expect, it, vi } from "vitest";
import { HttpSpellApiClient } from "./http-spell-api";
import type { SpellBundle, SpellCompileRequest } from "./types";

const request: SpellCompileRequest = {
  utterance: "召喚三顆紫色月亮",
  focusedEntityId: "guardian",
  scene: [],
  recentArtifacts: [],
};
const bundle: SpellBundle = {
  summary: "Three moons",
  modules: [
    {
      id: "moons",
      label: "Moons",
      tags: ["moon"],
      dependsOn: [],
      source: "() => ({ label: 'Moons', tags: [], setup() {}, dispose() {} })",
    },
  ],
};

describe("HttpSpellApiClient", () => {
  // Spec: Decision 0002 GEN-1; free language goes to the server compiler unchanged.
  it("posts the compile request to the server-side model endpoint", async () => {
    const fetcher = vi.fn(async () =>
      new Response(JSON.stringify({ bundle }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new HttpSpellApiClient(fetcher);

    await expect(client.compile(request)).resolves.toEqual(bundle);
    expect(fetcher).toHaveBeenCalledWith("/api/spells", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
  });

  // Spec: Decision 0002 GEN-5; API failures stay visible and never select a reference spell.
  it("surfaces server compilation errors", async () => {
    const client = new HttpSpellApiClient(
      async () => new Response(JSON.stringify({ error: "model refused" }), { status: 422 }),
    );

    await expect(client.compile(request)).rejects.toThrow("model refused");
  });

  // Regression: Arc/WebKit native fetch throws "Illegal invocation" with a class instance as this.
  it("invokes browser fetch with the global object instead of the API client as this", async () => {
    const browserLikeFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(
        new Response(JSON.stringify({ bundle }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch;
    const client = new HttpSpellApiClient(browserLikeFetch);

    await expect(client.compile(request)).resolves.toEqual(bundle);
  });
});
