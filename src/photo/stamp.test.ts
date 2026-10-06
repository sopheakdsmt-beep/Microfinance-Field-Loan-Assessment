import { describe, expect, it } from "vitest";
import { stampLines } from "./stamp";

describe("collateral stamp", () => {
  it("burns coordinates into the Khmer caption", () => {
    const lines = stampLines({
      borrowerName: "សុខ វណ្ណា",
      categoryLabel: "ប្លង់រឹង",
      capturedAt: Date.parse("2026-10-06T03:42:00Z"),
      latitude: 13.102714,
      longitude: 103.198221,
      accuracy: 8.4,
      officer: "រិទ្ធ សុផាន់",
      lang: "km",
    });
    expect(lines[0]).toBe("ប្លង់រឹង");
    expect(lines[1]).toBe("សុខ វណ្ណា");
    expect(lines[2]).toBe("13.102714, 103.198221 · ±8m");
    expect(lines[3]).toContain("ICT");
    expect(lines[3]).toContain("រិទ្ធ សុផាន់");
  });

  it("says when the tablet has no satellite fix", () => {
    const lines = stampLines({
      borrowerName: "Meas Chantra",
      categoryLabel: "Soft title",
      capturedAt: Date.parse("2026-10-06T03:42:00Z"),
      latitude: null,
      longitude: null,
      accuracy: null,
      officer: "Rith Sophan",
      lang: "en",
    });
    expect(lines[2]).toBe("GPS unavailable");
  });
});
