# AP3K Stripe catalog

Checkout resolves the live product catalog by stable lookup key before using legacy price-ID environment variables.

| Tier | Interval | Price | Lookup key |
| --- | --- | ---: | --- |
| Pro | Monthly | $9 | `ap3k_pro_month` |
| Pro | Annual | $79 | `ap3k_pro_year` |
| Business | Monthly | $29 | `ap3k_business_month` |
| Business | Annual | $279 | `ap3k_business_year` |

Do not replace these lookup keys when creating new versions of a price without also updating `lib/stripe-config.ts`. Legacy Creator/Agency price IDs are fallback-only for historical compatibility.
