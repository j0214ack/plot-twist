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
import {
  FileLeaveDoorOpenPersistence,
  formatLeaveDoorOpenConsoleSummary,
} from "./server/leave-door-open-persistence";
import { leaveDoorOpenPageRoutePlugin } from "./server/leave-door-open-page-route";
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
  const leaveDoorOpenCodexClient = new LocalCodexExecClient();
  const leaveDoorOpenOpenAiClient = env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
    : null;
  const createLeaveDoorOpenModel = (
    reasoningEffort: typeof leaveDoorOpenOptions.reasoningEffort,
  ): StructuredRoleModel =>
    leaveDoorOpenOptions.modelBackend === "codex"
      ? new CodexExecStructuredRoleModel(leaveDoorOpenCodexClient, {
          model: leaveDoorOpenOptions.model,
          reasoningEffort,
        })
      : leaveDoorOpenOpenAiClient !== null
        ? new OpenAiStructuredRoleModel(leaveDoorOpenOpenAiClient, {
            model: leaveDoorOpenOptions.model,
            reasoningEffort,
          })
        : {
            async call() {
              throw new Error("OPENAI_API_KEY is not configured on the server");
            },
          };
  const leaveDoorOpenModel = createLeaveDoorOpenModel(
    leaveDoorOpenOptions.reasoningEffort,
  );
  const leaveDoorOpenInputFirewallModel = createLeaveDoorOpenModel(
    leaveDoorOpenOptions.inputFirewallReasoningEffort,
  );
  const leaveDoorOpenPromptRoot = resolve(
    process.cwd(),
    "pocs/leave-the-door-open/validation/prompts",
  );
  const leaveDoorOpenPersistence = new FileLeaveDoorOpenPersistence(
    resolve(process.cwd(), leaveDoorOpenOptions.dataDirectory),
  );
  const leaveDoorOpenSessions = new LeaveDoorOpenSessionService(
    createLeaveDoorOpenWebSessionFactory({
      model: leaveDoorOpenModel,
      inputFirewallModel: leaveDoorOpenInputFirewallModel,
      prompts: {
        inputFirewall: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.inputFirewall,
          ),
          "utf8",
        ),
        persona: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.persona,
          ),
          "utf8",
        ),
        memorySelector: readFileSync(
          resolve(
            leaveDoorOpenPromptRoot,
            LEAVE_DOOR_OPEN_PROMPT_FILES.memorySelector,
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
      appendLogLine: (sessionId, line) => {
        leaveDoorOpenPersistence.appendJournalLine(sessionId, line);
        console.info(formatLeaveDoorOpenConsoleSummary(line));
      },
    }),
    { persistence: leaveDoorOpenPersistence },
  );

  return {
    plugins: [
      leaveDoorOpenPageRoutePlugin(),
      ...(command === "serve"
        ? [
            demoAccessPlugin(
              resolveDemoAccessOptions(env, {
                isPreview: Boolean(isPreview),
                mode,
              }),
            ),
          ]
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
