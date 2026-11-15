"use client";

import { Database, Download, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  type AnyBackupSource,
  backupFileName,
  buildBackup,
  parseBackup,
} from "@/shared/lib/backup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { PreferenceSection } from "./PreferenceSection";

const JSON_MIME = "application/json";

/** Triggers a browser download of `text` as a file (the only DOM side effect here). */
const downloadText = (text: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: JSON_MIME }));
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName });
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export / import / clear everything stored in this browser. Sources come from the feature
 * modules (passed in by the app), so this component knows no feature internals.
 */
export function DataManagement({ sources }: { readonly sources: ReadonlyArray<AnyBackupSource> }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [inputKey, setInputKey] = useState(0);

  const exportData = () => {
    const now = new Date();
    downloadText(JSON.stringify(buildBackup(sources, now), null, 2), backupFileName(now));
    toast("Backup downloaded", { description: "Keep it somewhere safe to restore later." });
  };

  const importData = async (file: File) => {
    const result = parseBackup(await file.text(), sources);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    result.plan.valid.forEach(({ source, data }) => source.write(data));
    const restored = result.plan.valid.map(({ source }) => source.label).join(", ");
    toast(restored ? "Backup restored" : "Nothing to restore", {
      description:
        result.plan.invalid.length > 0
          ? `${restored || "No sections"} restored. Skipped (invalid): ${result.plan.invalid.join(", ")}.`
          : restored || "The file had no data for this app.",
    });
  };

  const clearAll = () => {
    sources.forEach((source) => source.clear());
    toast("All local data cleared");
  };

  return (
    <PreferenceSection
      icon={Database}
      title="Your data"
      description="Everything (favorites, lists, ratings, episode progress, notes, reviews) lives only in this browser. Back it up to move it to another device or keep it safe."
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="outline" onClick={exportData}>
          <Download className="size-4" aria-hidden />
          Export backup
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <Upload className="size-4" aria-hidden />
          Import backup
        </Button>
        <input
          // Re-mounted after each pick, so choosing the same file again still fires onChange.
          key={inputKey}
          ref={fileInput}
          type="file"
          accept={`${JSON_MIME},.json`}
          className="sr-only"
          aria-label="Choose a backup file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setInputKey((key) => key + 1);
            if (file) void importData(file);
          }}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" aria-hidden />
              Clear all data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all local data?</AlertDialogTitle>
              <AlertDialogDescription>
                Favorites, lists, ratings, episode progress, notes, reviews and comments will be
                deleted from this browser. Export a backup first if you might want them back.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearAll}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Clear everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PreferenceSection>
  );
}
