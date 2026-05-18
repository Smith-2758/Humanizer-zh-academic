import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "./keys";
import { hasSeenHistoryNotice, markHistoryNoticeSeen } from "./notice";

describe("history notice storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts as unseen and can be marked seen", () => {
    expect(hasSeenHistoryNotice()).toBe(false);

    markHistoryNoticeSeen();

    expect(localStorage.getItem(STORAGE_KEYS.firstRunNotice)).toBe("true");
    expect(hasSeenHistoryNotice()).toBe(true);
  });
});
