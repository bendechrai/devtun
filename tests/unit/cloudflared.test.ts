import { describe, it, expect } from "vitest";
import {
  MIN_CLOUDFLARED_VERSION,
  parseCloudflaredVersion,
  compareVersions,
  isCloudflaredOutdated,
} from "../../src/lib/cloudflared.js";

describe("cloudflared version checks", () => {
  it("parses the version out of `cloudflared --version` output", () => {
    expect(
      parseCloudflaredVersion("cloudflared version 2026.10.4 (built 2026-10-26-11:25 UTC)\n")
    ).toBe("2026.10.4");
    expect(parseCloudflaredVersion("garbage")).toBeNull();
    expect(parseCloudflaredVersion("")).toBeNull();
  });

  it("compares dotted versions numerically, not lexically", () => {
    expect(compareVersions("2026.10.2", "2026.7.1")).toBeGreaterThan(0);
    expect(compareVersions("2026.7.1", "2026.10.2")).toBeLessThan(0);
    expect(compareVersions("2026.10.2", "2026.10.2")).toBe(0);
    expect(compareVersions("2026.10", "2026.10.0")).toBe(0);
    expect(compareVersions("2027.1.0", "2026.12.9")).toBeGreaterThan(0);
  });

  it("flags releases that still trust the compromised eMudhra intermediates", () => {
    expect(MIN_CLOUDFLARED_VERSION).toBe("2026.10.2");
    expect(isCloudflaredOutdated("2026.7.1")).toBe(true);
    expect(isCloudflaredOutdated("2026.10.1")).toBe(true);
    expect(isCloudflaredOutdated("2026.10.2")).toBe(false);
    expect(isCloudflaredOutdated("2026.10.4")).toBe(false);
  });
});
