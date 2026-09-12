"use client";

type Props = { className?: string };

export default function CookiePreferencesButton({ className = "" }: Props) {
  return (
    <button
      type="button"
      className={`text-left ${className}`}
      onClick={() => {
        window.localStorage.removeItem("ap3k_tracking_consent_v1");
        window.location.reload();
      }}
    >
      Cookie preferences
    </button>
  );
}
