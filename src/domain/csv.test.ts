import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("csv", () => {
  it("quotes names that contain commas and keeps Khmer text", () => {
    const csv = toCsv([
      ["ឈ្មោះ", "ភូមិ"],
      ["Sok, Vanna", "ភូមិស្រែថ្មី"],
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Sok, Vanna"');
    expect(csv).toContain("ភូមិស្រែថ្មី");
  });
});
