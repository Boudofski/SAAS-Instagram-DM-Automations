# Email autopilot

The launch-kit series is automatically processed hourly for confirmed subscribers only. AI chooses standard or checklist copy for each creator/store segment and follow-up stage. It can defer an eligible lesson by 0, 6 or 12 hours. It cannot write arbitrary claims, URLs, prices, recipients or extra messages. Confirmation and the requested kit are immediate deterministic templates.

Each run makes at most one planning request, shared across segments. The existing provider router supplies fallback across configured models. Invalid output or provider failure selects the standard template without delaying it. AP3K_EMAIL_AUTOPILOT_ENABLED=false disables model planning; AP3K_MARKETING_ENABLED=false pauses marketing delivery.

Decisions, scheduled time and final rendered payload are persisted in EmailDelivery.metadata. Retries reuse them and the original idempotency key. Existing pending deliveries are not rewritten. Suppression, unsubscribe, customer exit, the 24-hour spacing between lessons, and the 30-attempt daily budget remain enforced.

This is not a claim of conversion-optimized timing: no recipient timezone or reliable engagement evidence is currently supplied. Model instructions prefer zero additional delay. Existing consent covers a kit plus two lessons, not indefinite newsletters.

Transactional messages keep the existing event-driven templates. Existing optional lifecycle personalization remains separate. Model planning never changes billing/security facts or delivery eligibility. No new provider credentials or database migration are required.

Validation: policy rejection tests, template/footer contracts, deferred delivery, no replanning, and frozen queue payload tests run in CI. Production model/provider use must be confirmed from persisted source=ai decisions; fallback is reported as fallback, not AI.
