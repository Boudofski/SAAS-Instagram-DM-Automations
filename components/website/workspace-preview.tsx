import Image from "next/image";
import Link from "next/link";
import s from "./public-pages.module.css";

/** Existing public tutorial capture; never render a customer's live workspace. */
export default function WorkspacePreview() {
  return (
    <figure className={s.workspacePreview}>
      <div className={s.workspacePreviewHeader}>
        <strong>Inside AP3K</strong>
        <Link href="/help/workspace-tour">Explore the workspace →</Link>
      </div>
      <Image
        src="/images/tutorials/automations.png"
        width={2048}
        height={980}
        alt="AP3K automation workspace with campaign triggers, activity and status controls"
        sizes="(max-width: 767px) 92vw, 1000px"
        className={s.workspaceScreenshot}
      />
      <figcaption>
        Automation workspace example. Account activity and available features
        vary.
      </figcaption>
    </figure>
  );
}
