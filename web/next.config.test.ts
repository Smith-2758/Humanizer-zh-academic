import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next config", () => {
  it("sets security headers for all routes", async () => {
    const headerRules = await nextConfig.headers?.();
    const allRoutesRule = headerRules?.find((rule) => rule.source === "/:path*");

    expect(allRoutesRule?.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ]),
    );
  });

  it("pins turbopack root to the web project", () => {
    expect(nextConfig.turbopack?.root).toBe(__dirname);
  });
});
