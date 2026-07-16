import { defineConfig, loadEnv } from "vite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
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
import {
  leaveDoorOpenApiPlugin,
  LeaveDoorOpenSessionService,
} from "./server/leave-door-open-api";
import {
  LEAVE_DOOR_OPEN_PROMPT_FILES,
  resolveLeaveDoorOpenWebOptions,
} from "./server/leave-door-open-config";
import { createLeaveDoorOpenWebSessionFactory } from "./server/leave-door-open-runtime";
import { OpenAiStructuredRoleModel } from "./pocs/leave-the-door-open/src/live-openai-model";
import {
  CodexExecStructuredRoleModel,
  LocalCodexExecClient,
} from "./pocs/leave-the-door-open/src/codex-exec-model";
import type { StructuredRoleModel } from "./pocs/leave-the-door-open/src/live-protocol";

export default defineConfig(({ command, isPreview, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const previewAllowedHosts = env.ALLOWED_ORIGIN
    ? resolvePreviewAllowedHosts(env.ALLOWED_ORIGIN, Boolean(isPreview))
    : undefined;
  const profile = resolveSpellGenerationProfile(env);
  const leaveDoorOpenOptions = resolveLeaveDoorOpenWebOptions({
    ...env,
    LDO_WEB_MODEL_BACKEND:
      command === "serve" && mode === "ldo-local-codex"
        ? "codex"
        : "openai",
  });
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
  const leaveDoorOpenModel: StructuredRoleModel =
    leaveDoorOpenOptions.modelBackend === "codex"
      ? new CodexExecStructuredRoleModel(new LocalCodexExecClient(), {
          model: leaveDoorOpenOptions.model,
          reasoningEffort: leaveDoorOpenOptions.reasoningEffort,
        })
      : env.OPENAI_API_KEY
        ? new OpenAiStructuredRoleModel(
            new OpenAI({ apiKey: env.OPENAI_API_KEY }),
            {
              model: leaveDoorOpenOptions.model,
              reasoningEffort: leaveDoorOpenOptions.reasoningEffort,
            },
          )
        : {
            async call() {
              throw new Error("OPENAI_API_KEY is not configured on the server");
            },
          };
  const leaveDoorOpenPromptRoot = resolve(
    process.cwd(),
    "pocs/leave-the-door-open/validation/prompts",
  );
  const leaveDoorOpenSessions = new LeaveDoorOpenSessionService(
    createLeaveDoorOpenWebSessionFactory({
      model: leaveDoorOpenModel,
      prompts: {
        persona: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.persona,
          ),
          "utf8",
        ),
        actionJudge: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.actionJudge,
          ),
          "utf8",
        ),
        performanceDirector: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.performanceDirector,
          ),
          "utf8",
        ),
      },
      generatedPerformance: leaveDoorOpenOptions.generatedPerformance,
    }),
  );

  return {
    plugins: [
      ...(command === "serve"
        ? [demoAccessPlugin(resolveDemoAccessOptions(env, { isPreview: Boolean(isPreview) }))]
        : []),
      spellApiPlugin(compiler),
      transcriptionApiPlugin(transcription),
      leaveDoorOpenApiPlugin(leaveDoorOpenSessions),
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "index.html"),
          leaveTheDoorOpen: resolve(
            process.cwd(),
            "leave-the-door-open/index.html",
          ),
        },
      },
    },
    server: {
      host: "127.0.0.1",
    },
    preview: {
      allowedHosts: previewAllowedHosts,
    },
  };
});
