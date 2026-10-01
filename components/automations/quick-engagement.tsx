"use client";
import { useState, type ReactNode } from "react";
import {
  Clock3,
  Mail,
  Phone,
  Inbox,
  MessageCircle,
  UserRoundCheck,
  Send,
  Eye,
  EyeOff,
  Smile,
  MousePointerClick,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EditorRow, editorStyles as s } from "./editor-layout";
import UpgradeDialog, { ProBadge } from "./upgrade-dialog";
import {
  FOLLOW_UP_CONDITIONS,
  FOLLOW_UP_DELAYS,
  normalizeEngagementSettings,
  type EngagementSettings,
} from "@/lib/automation-engagement-settings";
import { useUi } from "@/components/i18n/use-ui";
export type QuickEngagementData = Partial<
  ReturnType<typeof normalizeEngagementSettings>
> & {
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
};
type Props = {
  leading?: ReactNode;
  data: QuickEngagementData;
  update: (v: Partial<QuickEngagementData>) => void;
  paid: boolean;
  followUpsReady: boolean;
  open: string | null;
  setOpen: (v: string | null) => void;
};
const conditionIcons = [
  Send,
  Eye,
  EyeOff,
  Smile,
  MousePointerClick,
  MousePointerClick,
  UserPlus,
  UserMinus,
];
export function QuickEngagementRows({
  data,
  update,
  open,
  setOpen,
  part,
}: {
  data: QuickEngagementData;
  update: Props["update"];
  open: string | null;
  setOpen: Props["setOpen"];
  part: "before" | "after";
}) {
  const tr = useUi();
  const field = (
    label: string,
    key:
      | "emailCapturePrompt"
      | "phoneCapturePrompt"
      | "followRequestDmText"
      | "followUpMessage",
  ) => (
    <label className={s.field}>
      {tr(label)}
      <textarea
        value={data[key] || ""}
        rows={4}
        maxLength={640}
        dir="auto"
        onChange={(e) => update({ [key]: e.target.value })}
      />
    </label>
  );
  const row = (key: string) => ({
    open: open === key,
    onOpen: () => setOpen(open === key ? null : key),
  });
  if (part === "after")
    return data.followUpEnabled ? (
      <EditorRow
        title="Follow up message"
        icon={<Clock3 />}
        {...row("followup")}
        onRemove={() => update({ followUpEnabled: false })}
      >
        <label className={s.field}>
          {tr("Send when")}
          <select
            value={data.followUpCondition || "ALWAYS"}
            onChange={(e) => update({ followUpCondition: e.target.value })}
          >
            {FOLLOW_UP_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {tr(c.label)}
              </option>
            ))}
          </select>
        </label>
        {field("Follow-up message", "followUpMessage")}
        <label className={s.field}>
          {tr("Minimum wait before sending")}
          <select
            value={data.followUpDelayMinutes ?? 30}
            onChange={(e) =>
              update({ followUpDelayMinutes: Number(e.target.value) })
            }
          >
            {FOLLOW_UP_DELAYS.map((m) => (
              <option key={m} value={m}>
                {m < 60
                  ? `${m} ${tr("minutes")}`
                  : `${m / 60} ${tr(m === 60 ? "hour" : "hours")}`}
              </option>
            ))}
          </select>
        </label>
        <p className={s.hint}>
          {tr(
            "Includes your link buttons. Timing is approximate. Cancels when they reply or someone takes over the conversation. Sends only within Instagram’s 24-hour messaging window.",
          )}
        </p>
        {data.followUpCondition && data.followUpCondition !== "ALWAYS" && (
          <p className={s.hint}>
            {tr(
              "The condition is checked after the delay. Follow changes require a confirmed before-and-after status. Message views and reactions depend on Instagram receipts.",
            )}
          </p>
        )}
      </EditorRow>
    ) : null;
  return (
    <>
      {data.followGateRequired && (
        <EditorRow
          title="Ask to follow"
          icon={<UserRoundCheck />}
          {...row("follow")}
          onRemove={() => update({ followGateRequired: false })}
        >
          {field("Follow request DM", "followRequestDmText")}
          <label className={s.field}>
            {tr("Verification button")}
            <input
              value={data.followRequestButtonText}
              maxLength={20}
              onChange={(e) =>
                update({ followRequestButtonText: e.target.value })
              }
            />
          </label>
          <p className={s.hint}>
            {tr("People who already follow skip this step.")}
          </p>
        </EditorRow>
      )}
      {data.emailCaptureEnabled && (
        <EditorRow
          title="Collect info"
          summary={tr("Email")}
          icon={<Mail />}
          {...row("email")}
          onRemove={() => update({ emailCaptureEnabled: false })}
        >
          {field("Email request", "emailCapturePrompt")}
          <p className={s.hint}>
            {tr("Saved to Contacts. Reply SKIP to continue or STOP to cancel.")}
          </p>
        </EditorRow>
      )}
      {data.phoneCaptureEnabled && (
        <EditorRow
          title="Collect info"
          summary={tr("Phone")}
          icon={<Phone />}
          {...row("phone")}
          onRemove={() => update({ phoneCaptureEnabled: false })}
        >
          {field("Phone request", "phoneCapturePrompt")}
          <p className={s.hint}>
            {tr("Saved to Contacts. Reply SKIP to continue or STOP to cancel.")}
          </p>
        </EditorRow>
      )}
    </>
  );
}
export function QuickEngagementButtons({
  leading,
  data,
  update,
  paid,
  followUpsReady,
  open,
  setOpen,
}: Props) {
  const tr = useUi();
  const [upgrade, setUpgrade] = useState(false);
  function add(key: string, v: Partial<QuickEngagementData>) {
    if (!paid) {
      setUpgrade(true);
      return;
    }
    update({ ...normalizeEngagementSettings(data), ...v });
    setOpen(key);
  }
  const badge = !paid ? <ProBadge /> : null;
  return (
    <>
      <div className={s.addons}>
        {leading}
        {!paid && (
          <>
            <button type="button" onClick={() => setUpgrade(true)}>
              <Inbox />
              {tr("Collect info")}
              {badge}
            </button>
            <button type="button" onClick={() => setUpgrade(true)}>
              <UserRoundCheck />
              {tr("Ask to follow")}
              {badge}
            </button>
            <button type="button" onClick={() => setUpgrade(true)}>
              <MessageCircle />
              {tr("Follow up message")}
              {badge}
            </button>
          </>
        )}
        {paid && (!data.emailCaptureEnabled || !data.phoneCaptureEnabled) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  if (!paid) {
                    e.preventDefault();
                    setUpgrade(true);
                  }
                }}
              >
                <Inbox />
                {tr("Collect info")}
                {badge}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="z-[60] min-w-48 rounded-2xl p-2"
            >
              {!data.emailCaptureEnabled && (
                <DropdownMenuItem
                  onSelect={() => add("email", { emailCaptureEnabled: true })}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {tr("Email")}
                </DropdownMenuItem>
              )}
              {!data.phoneCaptureEnabled && (
                <DropdownMenuItem
                  onSelect={() => add("phone", { phoneCaptureEnabled: true })}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {tr("Phone")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {paid && !data.followGateRequired && (
          <button
            type="button"
            onClick={() => add("follow", { followGateRequired: true })}
          >
            <UserRoundCheck />
            {tr("Ask to follow")}
            {badge}
          </button>
        )}
        {paid && !data.followUpEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"

                onClick={(e) => {
                  if (!paid) {
                    e.preventDefault();
                    setUpgrade(true);
                  }
                }}
              >
                <MessageCircle />
                {tr("Follow up message")}
                {badge}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="z-[60] max-h-[70dvh] min-w-60 overflow-y-auto rounded-2xl p-2"
            >
              {FOLLOW_UP_CONDITIONS.map((c, i) => {
                const Icon = conditionIcons[i];
                return (
                  <div key={c.value}>
                    {c.group &&
                      c.group !== FOLLOW_UP_CONDITIONS[i - 1]?.group && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>{tr(c.group)}</DropdownMenuLabel>
                        </>
                      )}
                    <DropdownMenuItem
                      onSelect={() =>
                        add("followup", {
                          followUpEnabled: true,
                          followUpCondition: c.value,
                        })
                      }
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tr(c.label)}
                    </DropdownMenuItem>
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {paid && !followUpsReady && (
        <p className={s.hint}>
          {tr("You can configure your follow-up now. Publishing requires the delivery scheduler to be ready.")}
        </p>
      )}
      <UpgradeDialog open={upgrade} onOpenChange={setUpgrade} />
    </>
  );
}
