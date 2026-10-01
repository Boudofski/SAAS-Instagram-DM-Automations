"use client";
import { useEffect, useRef, useState } from "react";
import { upload, type UploadTask } from "@upstash/blob/browser";
import { File, Mic, Upload, X, Loader2, Square } from "lucide-react";
import {
  ATTACHMENT_ACCEPT,
  attachmentId,
  validateAttachmentDeclaration,
  type MessageAttachment,
} from "@/lib/message-attachment";
import { startWavRecording } from "@/lib/record-audio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUi } from "@/components/i18n/use-ui";
export function AttachmentPreview({
  attachment,
}: {
  attachment: MessageAttachment;
}) {
  const source = attachmentId(attachment.url)
    ? new URL(attachment.url).pathname
    : "";
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-slate-100 p-3 text-sm text-slate-800 dark:bg-white/10 dark:text-slate-100">
      {attachment.mediaType === "IMAGE" ? (
        <img
          src={source}
          alt={attachment.name}
          className="max-h-48 w-full object-contain"
        />
      ) : attachment.mediaType === "VIDEO" ? (
        <video
          src={source}
          controls
          preload="metadata"
          playsInline
          className="max-h-48 w-full"
        />
      ) : attachment.mediaType === "AUDIO" ? (
        <audio
          src={source}
          controls
          preload="metadata"
          className="w-full max-w-full"
        />
      ) : (
        <a
          href={source}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 break-all"
        >
          <File size={20} />
          {attachment.name} · Download PDF
        </a>
      )}
    </div>
  );
}
export default function AttachmentPicker({
  value,
  onChange,
}: {
  value?: MessageAttachment;
  onChange: (attachment?: MessageAttachment) => void;
}) {
  const tr = useUi(),
    input = useRef<HTMLInputElement>(null),
    task = useRef<UploadTask>(),
    recording = useRef<Awaited<ReturnType<typeof startWavRecording>>>(),
    alive = useRef(true),
    unsubscribe = useRef<() => void>();
  const [busy, setBusy] = useState(false),
    [percent, setPercent] = useState(0),
    [error, setError] = useState(""),
    [drag, setDrag] = useState(false),
    [record, setRecord] = useState(false),
    [asking, setAsking] = useState(false),
    [recent, setRecent] = useState(false),
    [files, setFiles] = useState<MessageAttachment[]>([]),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      unsubscribe.current?.();
      task.current?.cancel();
      recording.current?.cancel();
    };
  }, []);
  async function pick(file?: globalThis.File) {
    if (!file || busy || asking || recording.current) return;
    setError("");
    try {
      validateAttachmentDeclaration(file.type, file.size);
      setBusy(true);
      setPercent(0);
      const current = upload(file, { route: "/api/attachments/upload" });
      task.current = current;
      unsubscribe.current = current.subscribe(() => {
        if (alive.current) setPercent(current.snapshot().percent);
      });
      const result = await current.done;
      if (alive.current) onChange(result.data as MessageAttachment);
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      unsubscribe.current?.();
      if (alive.current) setBusy(false);
    }
  }
  function stop() {
    const wav = recording.current?.stop();
    recording.current = undefined;
    setRecord(false);
    if (wav)
      void pick(
        new globalThis.File([wav], `Recording-${Date.now()}.wav`, {
          type: "audio/wav",
        }),
      );
  }
  async function start() {
    setError("");
    setAsking(true);
    try {
      const rec = await startWavRecording(() => stop());
      if (!alive.current) {
        rec.cancel();
        return;
      }
      recording.current = rec;
      setRecord(true);
    } catch {
      if (alive.current)
        setError(
          "Microphone access is unavailable. Allow microphone access or upload an audio file.",
        );
    } finally {
      if (alive.current) setAsking(false);
    }
  }
  async function showRecent() {
    setRecent(true);
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/attachments");
      if (!r.ok) throw new Error("Could not load your recent files.");
      const data = await r.json();
      if (alive.current) setFiles(data.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load files.");
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  const button =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10";
  return (
    <div>
      <input
        ref={input}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        aria-label={tr("Upload file")}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="space-y-3">
          <AttachmentPreview attachment={value} />
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate text-sm text-slate-500 dark:text-slate-400">
              {value.name}
            </span>
            <button
              type="button"
              className={button}
              onClick={() => onChange()}
              aria-label={tr("Remove attachment")}
            >
              <X size={16} />
              {tr("Remove")}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-5 text-center sm:p-7 ${drag ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : "border-slate-200 bg-white dark:border-white/20 dark:bg-transparent"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              <p role="status">
                {tr("Uploading file…")} {percent}%
              </p>
              <button
                type="button"
                className={button}
                onClick={() => task.current?.cancel()}
              >
                {tr("Cancel")}
              </button>
            </>
          ) : record ? (
            <>
              <p role="status" className="font-medium text-red-500">
                {tr("Recording audio…")}
              </p>
              <p className="text-xs text-slate-500">{tr("Up to 3 minutes")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" className={button} onClick={stop}>
                  <Square size={15} />
                  {tr("Stop and attach")}
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    recording.current?.cancel();
                    recording.current = undefined;
                    setRecord(false);
                  }}
                >
                  {tr("Cancel")}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${button} !rounded-xl`}
                onClick={() => input.current?.click()}
                disabled={asking}
              >
                <Upload size={18} />
                {tr("Upload file")}
              </button>
              <p className="font-semibold text-slate-900 dark:text-white">
                {tr("or drag and drop here")}
              </p>
              <p className="max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {tr("Image (PNG/JPG/GIF) up to 8MB")} ·{" "}
                {tr("Video (MP4/MOV) up to 25MB")} ·{" "}
                {tr("Audio (AAC/M4A/WAV) up to 25MB")} · {tr("PDF up to 25MB")}
              </p>
              <div className="flex w-full flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className={button}
                  onClick={() => void start()}
                  disabled={asking}
                >
                  {asking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mic size={16} />
                  )}{" "}
                  {tr("Record audio")}
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => void showRecent()}
                  disabled={asking}
                >
                  <File size={16} />
                  {tr("Pick recent")}
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {value?.mediaType === "FILE" && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {tr("PDFs are delivered as download links.")}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {tr(error)}
        </p>
      )}
      <Dialog open={recent} onOpenChange={setRecent}>
        <DialogContent className="max-h-[80dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("Pick recent")}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p role="status">{tr("Loading…")}</p>
          ) : !files.length ? (
            <p className="text-sm text-slate-500">
              {tr("Your uploaded files will appear here.")}
            </p>
          ) : (
            <div className="grid gap-2">
              {files.map((file) => (
                <button
                  type="button"
                  key={file.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 text-start hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5"
                  onClick={() => {
                    onChange(file);
                    setRecent(false);
                  }}
                >
                  <File size={20} />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-slate-500">
                    {file.mediaType}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
