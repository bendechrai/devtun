import { describe, it, expect, vi, beforeEach } from "vitest";

const execFileSync = vi.fn();
vi.mock("child_process", () => ({ execFileSync: (...args: unknown[]) => execFileSync(...args) }));

const { composeUp, composePull } = await import("../../src/lib/docker.js");

describe("composeUp", () => {
  beforeEach(() => {
    execFileSync.mockReset();
  });

  it("pulls latest images before starting the stack", () => {
    composeUp({ cwd: "/inst" });

    const calls = execFileSync.mock.calls.map((c) => (c[1] as string[]).join(" "));
    expect(calls).toEqual(["compose pull --quiet", "compose up -d"]);
    expect(execFileSync.mock.calls[0][2]).toMatchObject({ cwd: "/inst" });
  });

  it("still starts the stack with cached images when the pull fails", () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    execFileSync.mockImplementationOnce(() => {
      throw new Error("registry unreachable");
    });

    composeUp({ cwd: "/inst" });

    const calls = execFileSync.mock.calls.map((c) => (c[1] as string[]).join(" "));
    expect(calls).toEqual(["compose pull --quiet", "compose up -d"]);
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining("cached images"));
    stderr.mockRestore();
  });

  it("targets the configured Docker socket via DOCKER_HOST", () => {
    composePull({ cwd: "/inst", dockerSocket: "/var/run/docker-other.sock" });

    const env = (execFileSync.mock.calls[0][2] as { env: NodeJS.ProcessEnv }).env;
    expect(env.DOCKER_HOST).toBe("unix:///var/run/docker-other.sock");
  });
});
