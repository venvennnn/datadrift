"use client";

import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe } from "@/lib/store";
import type { AppSnapshot } from "@/lib/types";

export function useSnapshot(): AppSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
