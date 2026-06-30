"use client";

import { useEffect, useState } from "react";
import { Sparkles, BookOpen } from "lucide-react";
import { usePlanner } from "@/lib/store";
import { useGuide } from "./guide";
import { Modal } from "./ui/modal";
import { Button } from "./ui/button";

const KEY = "tempo-welcome-dismissed";

// One-time greeting for a brand-new (empty) workspace.
export function WelcomeDialog() {
  const { state, loadStarterCatalog } = usePlanner();
  const { openGuide } = useGuide();
  const [dismissed, setDismissed] = useState(true); // default hidden until checked

  useEffect(() => {
    try {
      setDismissed(!!localStorage.getItem(KEY));
    } catch {
      setDismissed(false);
    }
  }, []);

  const open = !dismissed && state.categories.length === 0;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
      }}
      accent="#FF90E8"
      title="Welcome to Tempo"
      subtitle="Plan a month of content in minutes"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              openGuide();
              close();
            }}
          >
            <BookOpen className="size-4" strokeWidth={2.5} />
            Read the guide
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              loadStarterCatalog();
              close();
            }}
          >
            <Sparkles className="size-4" strokeWidth={2.5} />
            Load starter catalog
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm font-semibold text-muted">
        <p>
          Tempo organizes your content into{" "}
          <b className="text-ink">4-week blocks</b> — one category per block —
          and auto-fills each week with a ready-to-edit posting cadence.
        </p>
        <p>
          To start, load the <b className="text-ink">starter catalog</b> (Mockup
          Studio · Packaging · PSD &amp; EPS), or go to{" "}
          <b className="text-ink">Categories</b> to build your own — then hit{" "}
          <b className="text-ink">Generate next block</b>.
        </p>
      </div>
    </Modal>
  );
}
