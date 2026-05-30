"use client";

import { type FormEvent, useState, useTransition } from "react";
import { adminUpdateCampaignRepliesAction } from "@/actions/admin/campaign-replies";

type Props = {
  campaignId: string;
  campaignName: string;
  initialReplies: {
    commentReply: string | null;
    commentReply2: string | null;
    commentReply3: string | null;
  };
  onSuccess?: () => void;
};

export function ReplyEditModal({ campaignId, campaignName, initialReplies, onSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [replies, setReplies] = useState({
    commentReply: initialReplies.commentReply ?? "",
    commentReply2: initialReplies.commentReply2 ?? "",
    commentReply3: initialReplies.commentReply3 ?? "",
  });
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setIsOpen(false);
    setReason("");
    setError(null);
    // Reset to initial if cancelled? Usually safer.
    setReplies({
      commentReply: initialReplies.commentReply ?? "",
      commentReply2: initialReplies.commentReply2 ?? "",
      commentReply3: initialReplies.commentReply3 ?? "",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!replies.commentReply.trim() && !replies.commentReply2.trim() && !replies.commentReply3.trim()) {
      setError("At least one reply variant must be provided.");
      return;
    }

    if (replies.commentReply.length > 500 || replies.commentReply2.length > 500 || replies.commentReply3.length > 500) {
      setError("Reply variants cannot exceed 500 characters.");
      return;
    }

    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("campaignId", campaignId);
      fd.set("reason", reason);
      fd.set("reply1", replies.commentReply);
      fd.set("reply2", replies.commentReply2);
      fd.set("reply3", replies.commentReply3);

      const result = await adminUpdateCampaignRepliesAction(fd);
      if (result.status === 200) {
        onSuccess?.();
        setIsOpen(false);
        setReason("");
        setError(null);
      } else {
        setError(typeof result.data === "string" ? result.data : "An unexpected error occurred.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
      >
        Edit replies
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) closeModal();
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Edit Reply Variants
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-200">
                {campaignName}
              </p>
              <p className="mt-2 text-[12px] text-slate-400">
                Update the public comment replies for this campaign. All changes are audited.
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Variant 1", key: "commentReply" },
                    { label: "Variant 2", key: "commentReply2" },
                    { label: "Variant 3", key: "commentReply3" },
                  ].map(({ label, key }, index) => {
                    const replyKey = key as keyof typeof replies;
                    return (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                          {label} {index > 0 && "(Optional)"}
                        </label>
                        <textarea
                          rows={3}
                          placeholder={`${label} text...`}
                          value={replies[replyKey]}
                          onChange={(e) => {
                            setReplies((prev) => ({ ...prev, [replyKey]: e.target.value }));
                            if (error) setError(null);
                          }}
                          disabled={isPending}
                          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-white/20 focus:outline-none disabled:opacity-50"
                        />
                        <p className="text-right text-[10px] text-slate-600">
                          {replies[replyKey].length}/500
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Previews */}
                <div className="flex flex-col gap-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Live Preview
                  </p>
                  {[
                    { label: "Variant 1", key: "commentReply" },
                    { label: "Variant 2", key: "commentReply2" },
                    { label: "Variant 3", key: "commentReply3" },
                  ].map(({ label, key }) => {
                    const replyKey = key as keyof typeof replies;
                    const text = replies[replyKey];
                    return (
                      <div
                        key={key}
                        className="min-h-[80px] rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                      >
                        <p className="text-[10px] font-bold uppercase text-slate-600 mb-1">
                          {label}
                        </p>
                        {text ? (
                          <p className="text-sm text-slate-300 break-words whitespace-pre-wrap italic">
                            &quot;{text}&quot;
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600 italic">No text provided.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div className="mt-6 flex flex-col gap-1.5 border-t border-white/10 pt-6">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Reason
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Why are you updating these replies? Min. 5 characters."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isPending}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-white/20 focus:outline-none disabled:opacity-50"
                />
                {error && (
                  <p role="alert" className="text-[11px] text-red-400">
                    {error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-[12px] font-bold text-slate-400 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-blue-500/80 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
