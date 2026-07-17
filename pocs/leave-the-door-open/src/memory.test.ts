import { describe, expect, it } from "vitest";
import {
  disclosureTierForChapter,
  getEligibleMemoryCards,
  getMemoryCard,
} from "./memory";

describe("authored Persona memory eligibility", () => {
  // Spec: ADR 0023 LDO-BIO-002; ADR 0031 LDO-CALENDAR-005.
  it("keeps protected history absent while exposing only actor-specific ordinary-work cues", () => {
    expect(disclosureTierForChapter("tutorial")).toBe("unnamed_loss");
    expect(disclosureTierForChapter(1)).toBe("unnamed_loss");
    expect(
      getEligibleMemoryCards({
        actorId: "wife",
        disclosureTier: disclosureTierForChapter(1),
      }),
    ).toEqual([
      {
        memoryId: "wife.work.ordinary_schedule",
        cue: expect.stringContaining("ordinary work"),
      },
    ]);
    expect(
      getEligibleMemoryCards({
        actorId: "husband",
        disclosureTier: disclosureTierForChapter(1),
      }),
    ).toEqual([
      {
        memoryId: "husband.work.ordinary_schedule",
        cue: expect.stringContaining("ordinary work"),
      },
    ]);
    expect(
      JSON.stringify(
        getEligibleMemoryCards({
          actorId: "husband",
          disclosureTier: disclosureTierForChapter(1),
        }),
      ),
    ).not.toMatch(/procurement|restaurant|09:00|bus/i);
  });

  // Spec: ADR 0023 Decisions 1, 2 and 5; Run 004 LDO-MEM-PROBE-001, 003.
  it("returns only phase-eligible actor-specific cues and keeps content behind the selected ID", () => {
    const eligible = getEligibleMemoryCards({
      actorId: "wife",
      disclosureTier: "personal_memory",
    });

    expect(eligible).toEqual(
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
    expect(JSON.stringify(eligible)).not.toMatch(/Nora|shard|bin|dishwasher/i);
    expect(
      getMemoryCard("wife.yellow_bowl.after_the_fact"),
    ).toMatchObject({
      actorId: "wife",
      content: expect.stringContaining("yellow shard"),
    });
    expect(
      getEligibleMemoryCards({
        actorId: "husband",
        disclosureTier: "personal_memory",
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memoryId: "husband.work.ordinary_schedule",
        }),
        expect.objectContaining({
          memoryId: "husband.yellow_bowl.practical_grief",
        }),
      ]),
    );
  });

  // Spec: chapter-1.md LDO-CH1-022; ADR 0032 LDO-SOCIAL-008.
  it("unlocks only the participant's authored memory after the bounded relationship closure exists", () => {
    expect(
      getEligibleMemoryCards({
        actorId: "husband",
        disclosureTier: "unnamed_loss",
      }),
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memoryId: "husband.relationship.distance_acknowledged",
        }),
      ]),
    );

    const eligible = getEligibleMemoryCards({
      actorId: "husband",
      disclosureTier: "unnamed_loss",
      relationshipConversation: "distance_acknowledged",
    });

    expect(eligible).toEqual(
      expect.arrayContaining([
        {
          memoryId: "husband.relationship.distance_acknowledged",
          cue: expect.stringContaining("bounded evening conversation"),
        },
      ]),
    );
    expect(JSON.stringify(eligible)).not.toMatch(
      /I miss talking|I know|yellow bowl|Nora/i,
    );
    expect(
      getMemoryCard("husband.relationship.distance_acknowledged"),
    ).toMatchObject({
      actorId: "husband",
      content: expect.stringContaining("Elise answered, “I know.”"),
    });
  });
});
