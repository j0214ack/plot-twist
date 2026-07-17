import { describe, expect, it, vi } from "vitest";
import type { MemorySelectorPort } from "./conversation";
import { selectRelevantMemoryForPersona } from "./memory-context";

const moment = {
  time: 1,
  locationId: "dining_area" as const,
  visibleActivityId: "idle" as const,
};

describe("Controller-owned Persona memory context", () => {
  // Spec: ADR 0035 LDO-LAT-003.
  it("selects an eligible authored work memory locally for a direct Chinese question", async () => {
    await expect(
      selectRelevantMemoryForPersona({
        actorId: "wife",
        disclosureTier: "unnamed_loss",
        moment,
        observedEvidence: [],
        conversation: [
          { speaker: "player", text: "我今天幾點上班？工作是做什麼的？" },
        ],
      }),
    ).resolves.toMatchObject({
      memoryId: "wife.work.ordinary_schedule",
      content: expect.stringContaining("payroll administrator"),
    });
  });

  // Spec: ADR 0031 LDO-CALENDAR-005; ADR 0023 Decision 2.
  it("offers only a safe work cue at the earliest tier and loads nothing when the selector declines it", async () => {
    const selectMemory = vi.fn<MemorySelectorPort["selectMemory"]>(
      async (request) => {
        expect(request.eligibleMemories).toEqual([
          {
            memoryId: "wife.work.ordinary_schedule",
            cue: expect.stringContaining("ordinary work"),
          },
        ]);
        expect(JSON.stringify(request)).not.toMatch(
          /payroll|dental|09:00|17:00/i,
        );
        return { memoryId: null };
      },
    );

    await expect(
      selectRelevantMemoryForPersona({
        actorId: "wife",
        disclosureTier: "unnamed_loss",
        moment,
        observedEvidence: [],
        conversation: [{ speaker: "player", text: "What happened here?" }],
        memorySelector: { selectMemory },
      }),
    ).resolves.toBeNull();
    expect(selectMemory).toHaveBeenCalledOnce();
  });

  // Spec: Run 004 result pipeline; ADR 0023 LDO-BIO-003.
  it("loads content only after an eligible actor-specific ID is selected", async () => {
    const selectMemory = vi.fn<MemorySelectorPort["selectMemory"]>(
      async (request) => {
        expect(request.eligibleMemories).toEqual(
          expect.arrayContaining([
            {
              memoryId: "wife.work.ordinary_schedule",
              cue: expect.stringContaining("ordinary work"),
            },
            {
              memoryId: "wife.yellow_bowl.after_the_fact",
              cue: expect.stringContaining("completed household change"),
            },
          ]),
        );
        expect(JSON.stringify(request)).not.toMatch(
          /yellow shard|dishwasher|Nora/i,
        );
        return { memoryId: "wife.yellow_bowl.after_the_fact" };
      },
    );

    await expect(
      selectRelevantMemoryForPersona({
        actorId: "wife",
        disclosureTier: "personal_memory",
        moment,
        observedEvidence: [],
        conversation: [
          {
            speaker: "player",
            text: "Why does learning afterward feel different?",
          },
        ],
        memorySelector: { selectMemory },
      }),
    ).resolves.toMatchObject({
      memoryId: "wife.yellow_bowl.after_the_fact",
      content: expect.stringContaining("yellow shard"),
    });
  });

  // Spec: Run 004 LDO-MEM-PROBE-001; ADR 0023 LDO-BIO-003.
  it("rejects a selector result outside the supplied actor-specific candidates", async () => {
    const memorySelector: MemorySelectorPort = {
      async selectMemory() {
        return { memoryId: "husband.yellow_bowl.practical_grief" };
      },
    };

    await expect(
      selectRelevantMemoryForPersona({
        actorId: "wife",
        disclosureTier: "personal_memory",
        moment,
        observedEvidence: [],
        conversation: [{ speaker: "player", text: "Think back." }],
        memorySelector,
      }),
    ).rejects.toThrow("Memory selector returned an ineligible ID");
  });

  // Spec: chapter-1.md LDO-CH1-022; ADR 0032 LDO-SOCIAL-008.
  it("offers the completed bounded exchange as selectable continuity instead of always-on Persona context", async () => {
    const selectMemory = vi.fn<MemorySelectorPort["selectMemory"]>(
      async (request) => {
        expect(request.eligibleMemories).toEqual(
          expect.arrayContaining([
            {
              memoryId: "wife.relationship.one_truth_returned",
              cue: expect.stringContaining("bounded evening conversation"),
            },
          ]),
        );
        expect(JSON.stringify(request)).not.toMatch(
          /missed knowing|everything properly|yellow bowl|Nora/i,
        );
        return { memoryId: "wife.relationship.one_truth_returned" };
      },
    );

    await expect(
      selectRelevantMemoryForPersona({
        actorId: "wife",
        disclosureTier: "unnamed_loss",
        relationshipConversation: "one_truth_returned",
        moment,
        observedEvidence: [],
        conversation: [
          {
            speaker: "player",
            text: "What was it like when Martin tried to talk last night?",
          },
        ],
        memorySelector: { selectMemory },
      }),
    ).resolves.toMatchObject({
      memoryId: "wife.relationship.one_truth_returned",
      content: expect.stringContaining("everything properly"),
    });
  });
});
