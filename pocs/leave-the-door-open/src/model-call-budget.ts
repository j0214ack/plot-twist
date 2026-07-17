import type {
  ModelUsage,
  StructuredRoleCall,
  StructuredRoleModel,
  StructuredRoleResult,
} from "./live-protocol";

export type ModelCallBudget = {
  maxCalls: number;
};

export type ModelCallBudgetSnapshot = {
  maxCalls: number;
  callsStarted: number;
  callsCompleted: number;
  usage: ModelUsage;
};

export class BudgetedStructuredRoleModel implements StructuredRoleModel {
  #callsStarted = 0;
  #callsCompleted = 0;
  readonly #usage: ModelUsage = {
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
  };

  constructor(
    private readonly model: StructuredRoleModel,
    private readonly budget: ModelCallBudget,
  ) {
    if (!Number.isInteger(budget.maxCalls) || budget.maxCalls < 1) {
      throw new Error("Model call budget maxCalls must be a positive integer");
    }
  }

  async call(request: StructuredRoleCall): Promise<StructuredRoleResult> {
    if (this.#callsStarted >= this.budget.maxCalls) {
      throw new Error(
        `Model call budget exhausted: ${this.#callsStarted}/${this.budget.maxCalls}`,
      );
    }
    this.#callsStarted += 1;

    const result = await this.model.call(request);
    this.#callsCompleted += 1;
    this.#usage.inputTokens += result.usage.inputTokens;
    this.#usage.outputTokens += result.usage.outputTokens;
    this.#usage.reasoningTokens += result.usage.reasoningTokens;
    return result;
  }

  snapshot(): ModelCallBudgetSnapshot {
    return {
      maxCalls: this.budget.maxCalls,
      callsStarted: this.#callsStarted,
      callsCompleted: this.#callsCompleted,
      usage: { ...this.#usage },
    };
  }
}
