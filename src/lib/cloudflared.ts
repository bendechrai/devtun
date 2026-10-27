/**
 * Minimum cloudflared release that no longer trusts the compromised eMudhra
 * (emSign) intermediate certificates disclosed by Cloudflare on 2026-10-20.
 * Anything older must be upgraded; `devtun up` re-pulls the image.
 */
export const MIN_CLOUDFLARED_VERSION = "2026.10.2";

/** Parse "cloudflared version 2026.10.4 (built ...)" into "2026.10.4". */
export function parseCloudflaredVersion(output: string): string | null {
  const m = output.match(/cloudflared version (\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

/** Numeric compare of dotted versions: negative if a < b, 0 if equal, positive if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10));
  const pb = b.split(".").map((n) => parseInt(n, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isCloudflaredOutdated(version: string): boolean {
  return compareVersions(version, MIN_CLOUDFLARED_VERSION) < 0;
}
