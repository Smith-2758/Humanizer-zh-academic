import { describe, expect, it, vi } from "vitest";
import { createMemoryRateLimiter } from "./rateLimit";

describe("memory rate limiter", () => {
  it("blocks after configured limit within a window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T00:00:00.000Z"));

    const limiter = createMemoryRateLimiter({ limit: 2, windowMs: 1_000 });

    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(true);
    expect(limiter.check("ip:1").allowed).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(limiter.check("ip:1").allowed).toBe(true);

    vi.useRealTimers();
  });
});
