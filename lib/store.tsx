"use client";

// Client store backed by the shared Neon/Postgres database (via server actions
// in ./actions). State is mirrored in React for snappy optimistic updates; every
// change is persisted, and the view refreshes on window focus so teammates'
// edits show up. The public `usePlanner` interface is identical to the previous
// localStorage version, so no UI code changed when we added the database.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AssetMeta,
  ContentItem,
  PlannerState,
  Status,
  Week,
} from "./types";
import { createInitialState, generateNextBlock } from "./engine";
import { addDays, parseISODate } from "./dates";
import { uid } from "./utils";
import { downscaleImage } from "./image";
import {
  loadPlanner,
  loadAssets,
  refreshPlanner,
  generateNextBlockAction,
  updateItemAction,
  moveItemAction,
  setStatusAction,
  updateWeekAction,
  addSubcategoryAction,
  toggleSubUsedAction,
  reorderSubcategoriesAction,
  uploadAssetAction,
  deleteAssetAction,
  resetAllAction,
} from "./actions";

function weekIdForDate(weeks: Week[], date: string): string | null {
  const w = weeks.find((w) => date >= w.startDate && date <= addDays(w.startDate, 6));
  return w ? w.id : null;
}

export interface PlannerActions {
  generateBlock: () => void;
  updateItem: (id: string, patch: Partial<ContentItem>) => void;
  moveItem: (id: string, newDate: string) => void;
  setStatus: (id: string, status: Status) => void;
  updateWeek: (id: string, patch: Partial<Week>) => void;
  setStory: (weekId: string, dayIndex: number, text: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  toggleSubUsed: (id: string) => void;
  reorderSubcategories: (categoryId: string, orderedIds: string[]) => void;
  uploadAsset: (contentItemId: string, file: File) => Promise<void>;
  deleteAsset: (id: string) => void;
  resetAll: () => void;
}

export interface PlannerContextValue extends PlannerActions {
  state: PlannerState;
  assets: AssetMeta[];
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlannerState | null>(null);
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<PlannerState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initial load (seed + Block 1 happens server-side on first run).
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPlanner(), loadAssets()])
      .then(([s, a]) => {
        if (cancelled) return;
        setState(s);
        setAssets(a);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // "Realtime enough": re-read the shared DB when the tab regains focus.
  useEffect(() => {
    const onFocus = () => {
      Promise.all([refreshPlanner(), loadAssets()])
        .then(([s, a]) => {
          setState(s);
          setAssets(a);
        })
        .catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const actions = useMemo<PlannerActions>(() => {
    const patchLocalItem = (id: string, fn: (i: ContentItem) => ContentItem) =>
      setState((prev) =>
        prev
          ? {
              ...prev,
              contentItems: prev.contentItems.map((i) =>
                i.id === id ? fn(i) : i,
              ),
            }
          : prev,
      );
    const log = (e: unknown) => console.error("[planner] persist failed", e);

    return {
      generateBlock: () => {
        setState((prev) => (prev ? generateNextBlock(prev, new Date()) : prev));
        generateNextBlockAction().then(setState).catch(log);
      },

      updateItem: (id, patch) => {
        patchLocalItem(id, (i) => ({ ...i, ...patch }));
        updateItemAction(id, patch).catch(log);
      },

      setStatus: (id, status) => {
        patchLocalItem(id, (i) => ({ ...i, status }));
        setStatusAction(id, status).catch(log);
      },

      moveItem: (id, newDate) => {
        const cur = stateRef.current;
        if (!cur) return;
        const dayOfWeek = parseISODate(newDate).getDay();
        const current = cur.contentItems.find((i) => i.id === id);
        const weekId = weekIdForDate(cur.weeks, newDate) ?? current?.weekId ?? "";
        patchLocalItem(id, (i) => ({ ...i, date: newDate, dayOfWeek, weekId }));
        moveItemAction(id, newDate, dayOfWeek, weekId).catch(log);
      },

      updateWeek: (id, patch) => {
        setState((prev) =>
          prev
            ? {
                ...prev,
                weeks: prev.weeks.map((w) =>
                  w.id === id ? { ...w, ...patch } : w,
                ),
              }
            : prev,
        );
        updateWeekAction(id, {
          theme: patch.theme,
          storyRotation: patch.storyRotation,
        }).catch(log);
      },

      setStory: (weekId, dayIndex, text) => {
        const week = stateRef.current?.weeks.find((w) => w.id === weekId);
        const rotation = week
          ? week.storyRotation.map((s, idx) => (idx === dayIndex ? text : s))
          : undefined;
        setState((prev) =>
          prev
            ? {
                ...prev,
                weeks: prev.weeks.map((w) =>
                  w.id === weekId && rotation
                    ? { ...w, storyRotation: rotation }
                    : w,
                ),
              }
            : prev,
        );
        if (rotation)
          updateWeekAction(weekId, { storyRotation: rotation }).catch(log);
      },

      addSubcategory: (categoryId, name) => {
        const tempId = `sub-temp-${uid()}`;
        setState((prev) => {
          if (!prev) return prev;
          const maxOrder = prev.subcategories
            .filter((s) => s.categoryId === categoryId)
            .reduce((m, s) => Math.max(m, s.order), -1);
          return {
            ...prev,
            subcategories: [
              ...prev.subcategories,
              { id: tempId, categoryId, name, used: false, order: maxOrder + 1 },
            ],
          };
        });
        addSubcategoryAction(categoryId, name)
          .then((created) =>
            setState((prev) =>
              prev
                ? {
                    ...prev,
                    subcategories: prev.subcategories.map((s) =>
                      s.id === tempId ? created : s,
                    ),
                  }
                : prev,
            ),
          )
          .catch((e) => {
            log(e);
            setState((prev) =>
              prev
                ? {
                    ...prev,
                    subcategories: prev.subcategories.filter(
                      (s) => s.id !== tempId,
                    ),
                  }
                : prev,
            );
          });
      },

      toggleSubUsed: (id) => {
        setState((prev) =>
          prev
            ? {
                ...prev,
                subcategories: prev.subcategories.map((s) =>
                  s.id === id
                    ? {
                        ...s,
                        used: !s.used,
                        usedInWeekId: !s.used ? s.usedInWeekId : undefined,
                      }
                    : s,
                ),
              }
            : prev,
        );
        toggleSubUsedAction(id).catch(log);
      },

      reorderSubcategories: (categoryId, orderedIds) => {
        const rank = new Map(orderedIds.map((id, i) => [id, i]));
        setState((prev) =>
          prev
            ? {
                ...prev,
                subcategories: prev.subcategories.map((s) =>
                  s.categoryId === categoryId && rank.has(s.id)
                    ? { ...s, order: rank.get(s.id)! }
                    : s,
                ),
              }
            : prev,
        );
        reorderSubcategoriesAction(orderedIds).catch(log);
      },

      uploadAsset: async (contentItemId, file) => {
        const image = await downscaleImage(file);
        const meta = await uploadAssetAction(contentItemId, image);
        setAssets((prev) => [...prev, meta]);
      },

      deleteAsset: (id) => {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        deleteAssetAction(id).catch(log);
      },

      resetAll: () => {
        setState(createInitialState(new Date()));
        setAssets([]);
        resetAllAction().then(setState).catch(log);
      },
    };
  }, []);

  const value = useMemo<PlannerContextValue | null>(
    () => (state ? { state, assets, ...actions } : null),
    [state, assets, actions],
  );

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper p-6">
        <div className="panel max-w-md p-6">
          <h1 className="font-display text-2xl font-extrabold">
            Can&apos;t reach the database
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Add your Neon connection strings to <code>.env</code> and run the
            migration:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border-2 border-ink bg-white p-3 font-mono text-xs">
            DATABASE_URL=&quot;…-pooler…&quot;{"\n"}DIRECT_URL=&quot;…&quot;{"\n"}
            {"\n"}pnpm prisma migrate dev
          </pre>
          <p className="mt-3 font-mono text-[11px] text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper">
        <div className="animate-pulse text-sm font-semibold tracking-wide text-neutral-500">
          Loading planner…
        </div>
      </div>
    );
  }

  return (
    <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used within a PlannerProvider");
  return ctx;
}
