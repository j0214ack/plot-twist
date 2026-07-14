import { defineConfig, loadEnv } from "vite";
import { spellApiPlugin, type SpellCompileService } from "./server/spell-api";
import { resolveSpellGenerationProfile } from "./server/spell-generation-profile";
import { createOpenAiSpellModelClient } from "./server/openai-spell-model";
import { SpellCompiler } from "./src/generative/spell-compiler";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const profile = resolveSpellGenerationProfile(env);
  const compiler: SpellCompileService = env.OPENAI_API_KEY
    ? new SpellCompiler(
        createOpenAiSpellModelClient({
          apiKey: env.OPENAI_API_KEY,
          model: profile.model,
          reasoningEffort: profile.reasoningEffort,
          serviceTier: profile.serviceTier,
        }),
      )
    : {
        compile: async () => {
          throw new Error("OPENAI_API_KEY is not configured on the server");
        },
      };

  return {
    plugins: [spellApiPlugin(compiler)],
    server: {
      host: "127.0.0.1",
    },
  };
});
