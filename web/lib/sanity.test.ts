import { describe, expect, it } from "vitest";
import { getAppName } from "./sanity";

describe("sanity", () => {
  it("returns the app name", () => {
    expect(getAppName()).toBe("Humanizer Academic");
  });
});
