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
        expect.objectContaining({ key: "Content-Security-Policy" }),
      ]),
    );
  });

  it("sets a production-safe CSP", async () => {
    const headerRules = await nextConfig.headers?.();
    const allRoutesRule = headerRules?.find((rule) => rule.source === "/:path*");
    const csp = allRoutesRule?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("connect-src 'self' https:");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("pins turbopack root to the web project", () => {
    expect(nextConfig.turbopack?.root).toBe(__dirname);
  });
});
