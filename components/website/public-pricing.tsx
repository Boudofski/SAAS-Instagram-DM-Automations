"use client";

import LocalizedCopy from "@/components/i18n/localized-copy";
import { useState } from "react";
import Link from "next/link";
import { Check, Instagram, MessageCircle, Sparkles, Zap } from "lucide-react";
import {
  PLAN_CARDS,
  PLAN_COMPARISON,
  checkoutHref,
  type BillingInterval,
  type PaidPlan,
} from "@/lib/billing-plans";
import s from "./public-pricing.module.css";
import shared from "./public-pages.module.css";

export default function PublicPricing() {
  const [interval, setInterval] = useState<BillingInterval>("year");
  return (
    <LocalizedCopy>
      <div className={s.billing}>
        <div className={s.toggle} role="group" aria-label="Billing interval">
          <button
            type="button"
            aria-pressed={interval === "month"}
            onClick={() => setInterval("month")}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={interval === "year"}
            onClick={() => setInterval("year")}
          >
            Yearly
          </button>
        </div>
        <p>
          Save up to <strong>27%</strong> with yearly billing
        </p>
      </div>
      <div className={s.cards}>
        {PLAN_CARDS.map((plan, index) => {
          const free = plan.id === "FREE";
          const total =
            interval === "year" ? plan.annualPrice! : plan.monthlyPrice!;
          const monthly = free ? 0 : interval === "year" ? total / 12 : total;
          return (
            <section
              key={plan.id}
              className={`${s.card} ${plan.featured ? s.featured : ""}`}
              aria-label={`${plan.name} plan`}
            >
              <div className={s.top}>
                <div className={s.name}>
                  <h2>{plan.name}</h2>
                  {plan.featured && <span>Popular</span>}
                </div>
                <p className={s.description}>
                  {
                    [
                      "Try Instagram automation, free.",
                      "More conversations. More possibilities.",
                      "More capacity for growing brands.",
                    ][index]
                  }
                </p>
                <div className={s.price}>
                  <strong>
                    ${Number.isInteger(monthly) ? monthly : monthly.toFixed(2)}
                  </strong>
                  <span>/month</span>
                </div>
                <p className={s.billed}>
                  {free
                    ? "Free forever. No card required."
                    : interval === "year"
                      ? `$${total} billed yearly · Save ${plan.annualSavingsPercent}%`
                      : `$${total} billed monthly`}
                </p>
                <Link
                  className={s.planButton}
                  href={
                    free
                      ? "/sign-up"
                      : checkoutHref(plan.id as PaidPlan, interval)
                  }
                >
                  {free ? "Start for free" : `Get ${plan.name}`}
                </Link>
              </div>
              <div className={s.features}>
                <p className={s.groupLabel}>
                  {free
                    ? "Your workspace"
                    : index === 1
                      ? "Everything in Free, plus"
                      : "Everything in Pro, plus"}
                </p>
                <ul>
                  <li>
                    <Instagram />
                    <span>
                      <strong>{["1", "3", "10"][index]}</strong> Instagram{" "}
                      {free ? "account" : "accounts"}
                    </span>
                  </li>
                  <li>
                    <Zap />
                    <span>
                      <strong>{plan.replyLimit.toLocaleString("en-US")}</strong>{" "}
                      automated actions / month
                    </span>
                  </li>
                  <li>
                    <MessageCircle />
                    <span>
                      {free
                        ? "5 active automations"
                        : "Unlimited active automations"}
                    </span>
                  </li>
                  {!free && (
                    <li>
                      <Sparkles />
                      <span>
                        <strong>{index === 1 ? "500" : "2,000"}</strong> AI
                        replies / month
                      </span>
                    </li>
                  )}
                </ul>
                <p className={s.groupLabel}>
                  {free ? "Automation essentials" : "Create, reply and grow"}
                </p>
                <ul>
                  {(free
                    ? [
                        "Keyword and any-comment triggers",
                        "Public replies and link delivery DMs",
                        "Write your own message variations",
                        "Lead tracking and analytics",
                      ]
                    : [
                        "AI-assisted replies and variations",
                        "AI tone and custom instructions",
                        "Publish custom canvas flows",
                        "Lead tracking and full analytics",
                      ]
                  ).map((feature) => (
                    <li key={feature}>
                      <Check />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
      <p className={s.usage}>
        One successful public reply or DM is one automated action. Usage resets
        monthly on every billing interval.
      </p>
      <section className={s.comparison}>
        <h2>Compare every plan</h2>
        <p>Find the right fit for your Instagram workflow.</p>
        <div
          className={shared.tableWrap}
          tabIndex={0}
          role="region"
          aria-label="Plan comparison, scroll horizontally on small screens"
        >
          <table className={`${shared.table} ${s.table}`}>
            <thead>
              <tr>
                <th scope="col">What&apos;s included</th>
                {PLAN_CARDS.map((p) => (
                  <th scope="col" key={p.id}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <th scope="row">{row.feature}</th>
                  {[row.free, row.pro, row.business].map((value, i) => (
                    <td key={i}>
                      {value === "Included" ? (
                        <>
                          <Check aria-hidden="true" className={s.check} />
                          <span className="sr-only">Included</span>
                        </>
                      ) : value === "Not included" ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Not included</span>
                        </>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </LocalizedCopy>
  );
}
