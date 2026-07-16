import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type {
  ModelUsage,
  StructuredRoleCall,
  StructuredRoleModel,
  StructuredRoleResult,
} from "./live-protocol";
import type { LiveReasoningEffort } from "./live-openai-model";

export type CodexExecRequest = {
  model: string;
  reasoningEffort: LiveReasoningEffort;
  prompt: string;
  outputSchema: Record<string, unknown>;
};

export type CodexExecResult = {
  finalResponse: string;
  usage: ModelUsage;
};

export interface CodexExecClient {
  run(request: CodexExecRequest): Promise<CodexExecResult>;
}

export type CodexProcessInvocation = {
  command: string;
  args: string[];
  cwd: string;
  stdin: string;
  env: NodeJS.ProcessEnv;
};

export type CodexProcessResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type CodexProcessRunner = (
  invocation: CodexProcessInvocation,
) => Promise<CodexProcessResult>;

export type LocalCodexExecClientOptions = {
  inheritedEnvironment?: NodeJS.ProcessEnv;
};

const disabledFeatures = [
  "shell_tool",
  "shell_snapshot",
  "unified_exec",
  "apps",
  "hooks",
  "goals",
  "multi_agent",
  "remote_plugin",
  "web_search",
];

export class LocalCodexExecClient implements CodexExecClient {
  readonly #environment: NodeJS.ProcessEnv;

  constructor(
    private readonly processRunner: CodexProcessRunner = runCodexProcess,
    options: LocalCodexExecClientOptions = {},
  ) {
    this.#environment = withoutApiCredentials(
      options.inheritedEnvironment ?? process.env,
    );
  }

  async run(request: CodexExecRequest): Promise<CodexExecResult> {
    const workingDirectory = await mkdtemp(join(tmpdir(), "ldo-codex-role-"));
    const schemaPath = join(workingDirectory, "output-schema.json");
    await writeFile(
      schemaPath,
      `${JSON.stringify(request.outputSchema, null, 2)}\n`,
      "utf8",
    );

    try {
      const args = [
        "exec",
        "--ephemeral",
        "--json",
        "--color",
        "never",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--model",
        request.model,
        "-c",
        `model_reasoning_effort=\"${request.reasoningEffort}\"`,
        "--cd",
        workingDirectory,
        "--output-schema",
        schemaPath,
        ...disabledFeatures.flatMap((feature) => ["--disable", feature]),
        "-",
      ];
      const processResult = await this.processRunner({
        command: "codex",
        args,
        cwd: workingDirectory,
        stdin: request.prompt,
        env: { ...this.#environment },
      });
      if (processResult.exitCode !== 0) {
        throw new Error(
          `Codex role process failed (${processResult.exitCode}): ${processResult.stderr.trim() || "no error output"}`,
        );
      }
      return parseCodexJsonLines(processResult.stdout);
    } finally {
      await rm(workingDirectory, { recursive: true, force: true });
    }
  }
}

export type CodexExecStructuredRoleModelOptions = {
  model: string;
  reasoningEffort: LiveReasoningEffort;
};

export class CodexExecStructuredRoleModel implements StructuredRoleModel {
  constructor(
    private readonly client: CodexExecClient,
    private readonly options: CodexExecStructuredRoleModelOptions,
  ) {}

  async call(request: StructuredRoleCall): Promise<StructuredRoleResult> {
    const startedAt = performance.now();
    const result = await this.client.run({
      model: this.options.model,
      reasoningEffort: this.options.reasoningEffort,
      prompt: [
        "DEVELOPER_INSTRUCTIONS",
        request.instructions,
        "",
        "ROLE_INPUT",
        request.input,
      ].join("\n"),
      outputSchema: z.toJSONSchema(request.schema) as Record<string, unknown>,
    });
    const parsed = request.schema.parse(JSON.parse(result.finalResponse));
    return {
      parsed,
      raw: { finalResponse: result.finalResponse },
      latencyMs: Math.round(performance.now() - startedAt),
      usage: result.usage,
    };
  }
}

const withoutApiCredentials = (
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv => {
  const sanitized = { ...environment };
  delete sanitized.OPENAI_API_KEY;
  delete sanitized.CODEX_API_KEY;
  delete sanitized.CODEX_ACCESS_TOKEN;
  return sanitized;
};

const parseCodexJsonLines = (stdout: string): CodexExecResult => {
  let finalResponse: string | null = null;
  let usage: ModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
  };

  for (const line of stdout.split("\n")) {
    if (line.trim().length === 0) continue;
    const event = JSON.parse(line) as {
      type?: string;
      message?: string;
      item?: { type?: string; text?: string };
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        reasoning_output_tokens?: number;
      };
    };
    if (
      event.type === "item.completed" &&
      event.item?.type === "agent_message" &&
      typeof event.item.text === "string"
    ) {
      finalResponse = event.item.text;
    }
    if (event.type === "turn.completed") {
      usage = {
        inputTokens: event.usage?.input_tokens ?? 0,
        outputTokens: event.usage?.output_tokens ?? 0,
        reasoningTokens: event.usage?.reasoning_output_tokens ?? 0,
      };
    }
    if (event.type === "turn.failed" || event.type === "error") {
      throw new Error(event.message ?? `Codex emitted ${event.type}`);
    }
  }

  if (finalResponse === null) {
    throw new Error("Codex returned no final agent message");
  }
  return { finalResponse, usage };
};

const runCodexProcess: CodexProcessRunner = async (
  invocation,
): Promise<CodexProcessResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      env: invocation.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });
    child.stdin.end(invocation.stdin);
  });
