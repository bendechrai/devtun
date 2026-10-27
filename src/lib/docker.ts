import { execFileSync } from "child_process";
import { DEFAULT_DOCKER_SOCKET } from "./config.js";
import { parseCloudflaredVersion } from "./cloudflared.js";

export interface DockerCtx {
  cwd: string;
  dockerSocket?: string;
}

function dockerEnv(dockerSocket?: string): NodeJS.ProcessEnv {
  if (dockerSocket && dockerSocket !== DEFAULT_DOCKER_SOCKET) {
    return { ...process.env, DOCKER_HOST: `unix://${dockerSocket}` };
  }
  return process.env;
}

function compose(args: string[], ctx: DockerCtx): string {
  return execFileSync("docker", ["compose", ...args], {
    cwd: ctx.cwd,
    env: dockerEnv(ctx.dockerSocket),
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

/**
 * Pull the latest images for the infra stack. The compose template uses
 * floating tags (traefik:v3, cloudflare/cloudflared:latest), and `compose up`
 * on its own reuses whatever image is already on disk - so without an explicit
 * pull a long-lived install never picks up security fixes (e.g. the cloudflared
 * 2026.10.2 release that distrusted the compromised eMudhra intermediates).
 *
 * Returns false (after printing a warning) instead of throwing when the pull
 * fails, so `devtun up` still works offline with the cached images.
 */
export function composePull(ctx: DockerCtx): boolean {
  try {
    execFileSync("docker", ["compose", "pull", "--quiet"], {
      cwd: ctx.cwd,
      env: dockerEnv(ctx.dockerSocket),
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    process.stderr.write(
      "Warning: could not pull latest images (offline?). Starting with cached images.\n"
    );
    return false;
  }
}

export function composeUp(ctx: DockerCtx): void {
  composePull(ctx);
  execFileSync("docker", ["compose", "up", "-d"], {
    cwd: ctx.cwd,
    env: dockerEnv(ctx.dockerSocket),
    stdio: "inherit",
  });
}

export function composeDown(ctx: DockerCtx): void {
  execFileSync("docker", ["compose", "down"], {
    cwd: ctx.cwd,
    env: dockerEnv(ctx.dockerSocket),
    stdio: "inherit",
  });
}

export function isDockerRunning(dockerSocket?: string): boolean {
  try {
    execFileSync("docker", ["info"], {
      env: dockerEnv(dockerSocket),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the cloudflared version running inside the instance's tunnel container.
 * Returns null if the container isn't running or the output is unparseable.
 */
export function tunnelCloudflaredVersion(containerName: string, dockerSocket?: string): string | null {
  try {
    const output = execFileSync("docker", ["exec", containerName, "cloudflared", "--version"], {
      env: dockerEnv(dockerSocket),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return parseCloudflaredVersion(output);
  } catch {
    return null;
  }
}

export function isStackRunning(ctx: DockerCtx): boolean {
  try {
    const output = compose(["ps", "--format", "json"], ctx);
    return output.length > 0;
  } catch {
    return false;
  }
}

export function restartProject(cwd: string, dockerSocket?: string): void {
  execFileSync("docker", ["compose", "up", "-d"], {
    cwd,
    env: dockerEnv(dockerSocket),
    stdio: "inherit",
  });
}
