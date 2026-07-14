import { defineConfig, loadEnv } from "vite";
import {
  resolveDemoAccessOptions,
  resolvePreviewAllowedHosts,
} from "./server/demo-access-config";
import { demoAccessPlugin } from "./server/demo-access";
import {
  createOpenAiTranscriptionService,
  DEFAULT_TRANSCRIPTION_MODEL,
} from "./server/openai-transcription";
import { spellApiPlugin, type SpellCompileService } from "./server/spell-api";
import { resolveSpellGenerationProfile } from "./server/spell-generation-profile";
import { transcriptionApiPlugin, type TranscriptionService } from "./server/transcription-api";
import { createOpenAiSpellModelClient } from "./server/openai-spell-model";
import { SpellCompiler } from "./src/generative/spell-compiler";

export default defineConfig(({ command, isPreview, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const previewAllowedHosts = env.ALLOWED_ORIGIN
    ? resolvePreviewAllowedHosts(env.ALLOWED_ORIGIN, Boolean(isPreview))
    : undefined;
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
  const transcription: TranscriptionService = env.OPENAI_API_KEY
    ? createOpenAiTranscriptionService({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
      })
    : {
        transcribe: async () => {
          throw new Error("OPENAI_API_KEY is not configured on the server");
        },
      };

  return {
    plugins: [
      ...(command === "serve"
        ? [demoAccessPlugin(resolveDemoAccessOptions(env, { isPreview: Boolean(isPreview) }))]
        : []),
      spellApiPlugin(compiler),
      transcriptionApiPlugin(transcription),
    ],
    server: {
      host: "127.0.0.1",
    },
    preview: {
      allowedHosts: previewAllowedHosts,
    },
  };
});
