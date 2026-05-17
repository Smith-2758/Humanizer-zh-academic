import { STORAGE_KEYS } from "./keys";

export function hasSeenHistoryNotice() {
  return localStorage.getItem(STORAGE_KEYS.firstRunNotice) === "true";
}

export function markHistoryNoticeSeen() {
  localStorage.setItem(STORAGE_KEYS.firstRunNotice, "true");
}
