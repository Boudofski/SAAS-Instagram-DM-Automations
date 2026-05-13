# ReplyFlow AI — Phase 1 Core Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the webhook architecture, add duplicate prevention, new Prisma models for event/lead/message logging, contains keyword matching, template variables, and public comment reply so comment-to-DM automation works reliably end-to-end.

**Architecture:** Move the webhook to a canonical public route with Meta verify-token validation. Add three new Prisma models (Lead, AutomationEvent, MessageLog) as the analytics and duplicate-prevention source of truth. Extract two pure utility functions (template resolver, keyword matcher) and TDD them. Rewrite the webhook handler to use the new flow: find automation → match keyword → duplicate check → send public reply → send DM → log everything.

**Tech Stack:** Next.js 14 App Router, Prisma 6 (PostgreSQL), TypeScript, Clerk, OpenAI, Meta Graph API, vitest for unit tests on pure functions

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `.env.example` | Add META_APP_ID, META_APP_SECRET, META_VERIFY_TOKEN, META_REDIRECT_URI, OPENAI_API_KEY, REDIS_URL |
| Create | `vitest.config.ts` | Test runner — path aliases, node environment |
| Modify | `package.json` | Add vitest + test script |
| Modify | `prisma/schema.prisma` | Add Lead, AutomationEvent, MessageLog models; add MATCHING_MODE, EVENT_TYPE, MESSAGE_TYPE, SEND_STATUS enums; add matchingMode to Automation; add ctaLink to Listener |
| Create | `lib/matching.ts` | Pure `matchKeywordWithMode` function |
| Create | `lib/matching.test.ts` | Unit tests for matchKeywordWithMode |
| Create | `lib/template.ts` | Pure `resolveTemplate` function |
| Create | `lib/template.test.ts` | Unit tests for resolveTemplate |
| Modify | `lib/fetch.ts` | Fix sendPrivateMessage URL, add sendCommentReply |
| Modify | `lib/openai.ts` | Use OPENAI_API_KEY env var (was OPEN_AI_KEY) |
| Rewrite | `actions/webhook/queries.ts` | findAutomationForComment, findAutomationForDM, isDuplicate, createMessageLog, upsertLead, createAutomationEvent; fix createChatHistory param names |
| Create | `app/api/webhooks/meta/route.ts` | Canonical public webhook — GET verify + POST full flow |
| Delete | `app/(protected)/api/webhook/instagram/route.ts` | Replaced by canonical route above |
| Modify | `actions/automation/queries.ts` | Update addListener to accept ctaLink; add getAutomationAnalytics |

---

## Task 1: Test infrastructure + .env.example

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install vitest**

```bash
cd /Users/abdou/Desktop/SAAS-Instagram-DM-Automations
npm install --save-dev vitest @vitest/coverage-v8
```

Expected: vitest and coverage added to devDependencies, no install errors.

- [ ] **Step 2: Add test script to package.json**

Open `package.json` and add under `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Full scripts block after edit:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "postinstall": "prisma generate",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Update .env.example**

Replace the entire contents of `.env.example` with:

```bash
# Database
DATABASE_URL=

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard

# App URL
NEXT_PUBLIC_HOST_URL=http://localhost:3000

# Stripe
STRIPE_SUBSCRIPTION_PRICE_ID=
STRIPE_CLIENT_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Meta / Instagram
META_APP_ID=
META_APP_SECRET=
META_VERIFY_TOKEN=a-random-secret-you-choose
META_REDIRECT_URI=http://localhost:3000/callback/instagram
INSTAGRAM_BASE_URL=https://graph.instagram.com
INSTAGRAM_EMBEDDED_OAUTH_URL=
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
INSTAGRAM_TOKEN_URL=

# OpenAI (for SMARTAI listener mode)
OPENAI_API_KEY=

# Redis (optional — for future async queue)
REDIS_URL=
```

- [ ] **Step 5: Verify vitest works**

```bash
npx vitest run --reporter=verbose 2>&1 | head -20
```

Expected output: `No test files found` (no tests yet — that's fine, no error exit).

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts .env.example package-lock.json
git commit -m "chore: add vitest test runner and update .env.example with Meta/OpenAI vars"
```

---

## Task 2: Prisma schema additions

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Open prisma/schema.prisma and make the following additions**

Add four new enums after the existing `LISTENERS` enum:

```prisma
enum MATCHING_MODE {
  EXACT
  CONTAINS
  SMART_AI
}

enum EVENT_TYPE {
  COMMENT_RECEIVED
  DM_SENT
  PUBLIC_REPLY_SENT
  DM_FAILED
  PUBLIC_REPLY_FAILED
  DUPLICATE_SKIPPED
  NO_MATCH
}

enum MESSAGE_TYPE {
  DM
  COMMENT_REPLY
}

enum SEND_STATUS {
  SENT
  FAILED
  SKIPPED
}
```

- [ ] **Step 2: Update the Automation model**

Add `matchingMode`, `leads`, `events`, and `messageLogs` fields. The updated model:

```prisma
model Automation {
  id           String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String            @default("Untitled")
  createdAt    DateTime          @default(now())
  active       Boolean           @default(false)
  matchingMode MATCHING_MODE     @default(EXACT)
  trigger      Trigger[]
  listener     Listener?
  posts        Post[]
  dms          Dms[]
  User         User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String?           @db.Uuid
  keywords     Keyword[]
  leads        Lead[]
  events       AutomationEvent[]
  messageLogs  MessageLog[]
}
```

- [ ] **Step 3: Update the Listener model**

Add `ctaLink` field:

```prisma
model Listener {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  Automation   Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)
  automationId String     @unique @db.Uuid
  listener     LISTENERS  @default(MESSAGE)
  prompt       String
  commentReply String?
  ctaLink      String?
  dmCount      Int        @default(0)
  commentCount Int        @default(0)
}
```

- [ ] **Step 4: Add the three new models**

Add these three models after the `Keyword` model:

```prisma
model Lead {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  automationId String     @db.Uuid
  automation   Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)
  igUserId     String
  igUsername   String?
  commentText  String?
  mediaId      String?
  createdAt    DateTime   @default(now())

  @@unique([automationId, igUserId])
}

model AutomationEvent {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  automationId String     @db.Uuid
  automation   Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)
  eventType    EVENT_TYPE
  igUserId     String?
  mediaId      String?
  commentId    String?
  keyword      String?
  meta         Json?
  createdAt    DateTime   @default(now())
}

model MessageLog {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  automationId   String       @db.Uuid
  automation     Automation   @relation(fields: [automationId], references: [id], onDelete: Cascade)
  recipientIgId  String
  mediaId        String?
  commentId      String?
  messageType    MESSAGE_TYPE
  status         SEND_STATUS
  errorMessage   String?
  sentAt         DateTime?
  createdAt      DateTime     @default(now())
}
```

- [ ] **Step 5: Run the migration**

```bash
npx prisma migrate dev --name phase1-schema
```

Expected: `Your database is now in sync with your schema.` — new tables created. If prompted for a migration name confirmation, type `phase1-schema`.

- [ ] **Step 6: Verify Prisma client generation**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` — no errors.

- [ ] **Step 7: Commit**

```bash
git add prisma/
git commit -m "feat(schema): add Lead, AutomationEvent, MessageLog models; add matchingMode and ctaLink fields"
```

---

## Task 3: Pure keyword matching function (TDD)

**Files:**
- Create: `lib/matching.ts`
- Create: `lib/matching.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/matching.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { matchKeywordWithMode } from "./matching";

const keywords = [
  { word: "GUIDE" },
  { word: "price" },
  { word: "FREE" },
];

describe("matchKeywordWithMode — EXACT", () => {
  it("matches exact keyword case-insensitively", () => {
    expect(matchKeywordWithMode("guide", keywords, "EXACT")).toBe("GUIDE");
    expect(matchKeywordWithMode("GUIDE", keywords, "EXACT")).toBe("GUIDE");
    expect(matchKeywordWithMode("Guide", keywords, "EXACT")).toBe("GUIDE");
  });

  it("does not match a substring in EXACT mode", () => {
    expect(matchKeywordWithMode("I want the GUIDE please", keywords, "EXACT")).toBeNull();
  });

  it("returns null for no match", () => {
    expect(matchKeywordWithMode("hello world", keywords, "EXACT")).toBeNull();
  });
});

describe("matchKeywordWithMode — CONTAINS", () => {
  it("matches when comment contains the keyword", () => {
    expect(matchKeywordWithMode("I want the GUIDE please", keywords, "CONTAINS")).toBe("GUIDE");
    expect(matchKeywordWithMode("send me the guide!", keywords, "CONTAINS")).toBe("GUIDE");
  });

  it("still matches exact in CONTAINS mode", () => {
    expect(matchKeywordWithMode("GUIDE", keywords, "CONTAINS")).toBe("GUIDE");
  });

  it("returns null when keyword not present", () => {
    expect(matchKeywordWithMode("hello world", keywords, "CONTAINS")).toBeNull();
  });
});

describe("matchKeywordWithMode — SMART_AI", () => {
  it("falls back to CONTAINS behaviour", () => {
    expect(matchKeywordWithMode("Can I get the guide?", keywords, "SMART_AI")).toBe("GUIDE");
  });
});

describe("matchKeywordWithMode — edge cases", () => {
  it("returns null for empty comment text", () => {
    expect(matchKeywordWithMode("", keywords, "EXACT")).toBeNull();
  });

  it("returns null for empty keyword list", () => {
    expect(matchKeywordWithMode("GUIDE", [], "EXACT")).toBeNull();
  });

  it("returns first matched keyword when multiple could match", () => {
    const multi = [{ word: "FREE" }, { word: "free guide" }];
    const result = matchKeywordWithMode("get free guide now", multi, "CONTAINS");
    expect(result).toBe("FREE");
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run lib/matching.test.ts --reporter=verbose
```

Expected: `FAIL` — `Cannot find module './matching'`

- [ ] **Step 3: Create lib/matching.ts**

```typescript
import { MATCHING_MODE } from "@prisma/client";

export function matchKeywordWithMode(
  text: string,
  keywords: { word: string }[],
  mode: MATCHING_MODE
): string | null {
  const lower = text.toLowerCase().trim();

  for (const kw of keywords) {
    const kwLower = kw.word.toLowerCase();

    if (mode === "EXACT") {
      if (lower === kwLower) return kw.word;
    } else {
      // CONTAINS and SMART_AI both use substring match.
      // SMART_AI adds optional OpenAI verification at the call site.
      if (lower.includes(kwLower)) return kw.word;
    }
  }

  return null;
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
npx vitest run lib/matching.test.ts --reporter=verbose
```

Expected: All tests `PASS`.

- [ ] **Step 5: Commit**

```bash
git add lib/matching.ts lib/matching.test.ts
git commit -m "feat(lib): add matchKeywordWithMode pure utility with TDD"
```

---

## Task 4: Template variable resolver (TDD)

**Files:**
- Create: `lib/template.ts`
- Create: `lib/template.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `lib/template.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { resolveTemplate } from "./template";

describe("resolveTemplate", () => {
  it("replaces {{username}}", () => {
    expect(resolveTemplate("Hey {{username}}!", { username: "john_doe" })).toBe("Hey john_doe!");
  });

  it("replaces {{first_name}}", () => {
    expect(resolveTemplate("Hi {{first_name}}", { first_name: "Jane" })).toBe("Hi Jane");
  });

  it("replaces {{keyword}}", () => {
    expect(resolveTemplate("You typed {{keyword}}", { keyword: "GUIDE" })).toBe("You typed GUIDE");
  });

  it("replaces {{link}}", () => {
    expect(resolveTemplate("Get it here: {{link}}", { link: "https://example.com/guide" })).toBe(
      "Get it here: https://example.com/guide"
    );
  });

  it("replaces all four variables in one string", () => {
    const result = resolveTemplate(
      "Hi {{first_name}} (@{{username}}), you said {{keyword}}. Here: {{link}}",
      { first_name: "Alex", username: "alex_ig", keyword: "PRICE", link: "https://go.com" }
    );
    expect(result).toBe("Hi Alex (@alex_ig), you said PRICE. Here: https://go.com");
  });

  it("replaces multiple occurrences of the same variable", () => {
    expect(
      resolveTemplate("{{first_name}}, hi {{first_name}}!", { first_name: "Sam" })
    ).toBe("Sam, hi Sam!");
  });

  it("substitutes empty string for missing variables", () => {
    expect(resolveTemplate("Hey {{username}}", {})).toBe("Hey ");
  });

  it("is case-insensitive for variable names", () => {
    expect(resolveTemplate("{{USERNAME}} and {{First_Name}}", { username: "u1", first_name: "F1" })).toBe(
      "u1 and F1"
    );
  });

  it("returns the template unchanged when no variables present", () => {
    expect(resolveTemplate("Hello world! No vars here.", {})).toBe("Hello world! No vars here.");
  });

  it("handles empty template string", () => {
    expect(resolveTemplate("", { username: "x" })).toBe("");
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

```bash
npx vitest run lib/template.test.ts --reporter=verbose
```

Expected: `FAIL` — `Cannot find module './template'`

- [ ] **Step 3: Create lib/template.ts**

```typescript
export type TemplateVars = {
  username?: string;
  first_name?: string;
  keyword?: string;
  link?: string;
};

export function resolveTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{username\}\}/gi, vars.username ?? "")
    .replace(/\{\{first_name\}\}/gi, vars.first_name ?? "")
    .replace(/\{\{keyword\}\}/gi, vars.keyword ?? "")
    .replace(/\{\{link\}\}/gi, vars.link ?? "");
}
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
npx vitest run lib/template.test.ts --reporter=verbose
```

Expected: All 10 tests `PASS`.

- [ ] **Step 5: Commit**

```bash
git add lib/template.ts lib/template.test.ts
git commit -m "feat(lib): add resolveTemplate pure utility with TDD — supports {{username}}, {{first_name}}, {{keyword}}, {{link}}"
```

---

## Task 5: Fix lib/openai.ts + lib/fetch.ts

**Files:**
- Modify: `lib/openai.ts`
- Modify: `lib/fetch.ts`

- [ ] **Step 1: Fix lib/openai.ts to use OPENAI_API_KEY**

Read the current file first, then replace:

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

This switches from the non-standard `OPEN_AI_KEY` to `OPENAI_API_KEY`, which is the standard variable name the OpenAI SDK reads automatically. The `apiKey` option can be left out entirely if using the standard name, but explicit is clearer.

- [ ] **Step 2: Fix sendPrivateMessage URL in lib/fetch.ts**

The current `sendPrivateMessage` is missing the API version prefix. Update the URL from:
```
`${process.env.INSTAGRAM_BASE_URL}/${userId}/messages`
```
to:
```
`${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`
```

- [ ] **Step 3: Add sendCommentReply to lib/fetch.ts**

Add this function after `sendPrivateMessage`:

```typescript
/**
 * Posts a visible public reply under a comment.
 * Uses the Facebook Graph API (not INSTAGRAM_BASE_URL) — this endpoint
 * lives on graph.facebook.com for all Business/Creator accounts.
 */
export const sendCommentReply = async (
  commentId: string,
  message: string,
  token: string
) => {
  return await axios.post(
    `https://graph.facebook.com/v21.0/${commentId}/replies`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
```

The full updated `lib/fetch.ts` after both edits:

```typescript
import axios from "axios";

export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(
    `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );
  return refresh_token.data;
};

export const sendDm = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
    {
      recipient: { id: receiverId },
      message: { text: prompt },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendPrivateMessage = async (
  userId: string,
  commentId: string,
  message: string,
  token: string
) => {
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/v21.0/${userId}/messages`,
    {
      recipient: { comment_id: commentId },
      message: { text: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendCommentReply = async (
  commentId: string,
  message: string,
  token: string
) => {
  return await axios.post(
    `https://graph.facebook.com/v21.0/${commentId}/replies`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const generateToken = async (code: string) => {
  const insta_form = new FormData();
  insta_form.append("client_id", process.env.INSTAGRAM_CLIENT_ID as string);
  insta_form.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET as string);
  insta_form.append("grant_type", "authorization_code");
  insta_form.append(
    "redirect_uri",
    `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
  );
  insta_form.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  if (token.permissions.length > 0) {
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${token.access_token}`
    );
    return long_token.data;
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add lib/openai.ts lib/fetch.ts
git commit -m "fix(lib): use OPENAI_API_KEY env var; fix sendPrivateMessage URL version prefix; add sendCommentReply"
```

---

## Task 6: Rewrite actions/webhook/queries.ts

**Files:**
- Rewrite: `actions/webhook/queries.ts`

This file is fully replaced. The old `matchKeyword`, `getKeywordAutomation`, and `getKeywordPost` functions are removed (they are only used by the old webhook being deleted in Task 9). The new functions are the single source of truth for all webhook database operations.

- [ ] **Step 1: Replace the entire file with the following**

```typescript
import { client } from "@/lib/prisma";
import { matchKeywordWithMode } from "@/lib/matching";
import type {
  Automation,
  Keyword,
  Listener,
  Integrations,
  Subscription,
  MATCHING_MODE,
  EVENT_TYPE,
  MESSAGE_TYPE,
  SEND_STATUS,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type AutomationWithRelations = Automation & {
  keywords: Keyword[];
  listener: Listener | null;
  User: {
    subscription: Subscription | null;
    integrations: Pick<Integrations, "token">[];
  } | null;
};

// ---------------------------------------------------------------------------
// Automation lookup — for COMMENT trigger
// ---------------------------------------------------------------------------

/**
 * Finds an active automation that:
 * - has a COMMENT trigger
 * - has a Post with postid matching the commented media
 * - belongs to a user whose Instagram account ID matches the webhook entry.id
 */
export const findAutomationForComment = async (
  mediaId: string,
  igAccountId: string
): Promise<AutomationWithRelations | null> => {
  return await client.automation.findFirst({
    where: {
      active: true,
      trigger: { some: { type: "COMMENT" } },
      posts: { some: { postid: mediaId } },
      User: {
        integrations: { some: { instagramId: igAccountId } },
      },
    },
    include: {
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: { token: true },
            where: { instagramId: igAccountId },
          },
        },
      },
    },
  });
};

// ---------------------------------------------------------------------------
// Automation lookup — for DM trigger
// ---------------------------------------------------------------------------

/**
 * Finds the first active automation with a DM trigger that has a keyword
 * matching the DM text, for the given Instagram account.
 */
export const findAutomationForDM = async (
  dmText: string,
  igAccountId: string
): Promise<{ automation: AutomationWithRelations; matchedKeyword: string } | null> => {
  const automations = await client.automation.findMany({
    where: {
      active: true,
      trigger: { some: { type: "DM" } },
      User: {
        integrations: { some: { instagramId: igAccountId } },
      },
    },
    include: {
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: { token: true },
            where: { instagramId: igAccountId },
          },
        },
      },
    },
  });

  for (const automation of automations) {
    const matched = matchKeywordWithMode(
      dmText,
      automation.keywords,
      automation.matchingMode
    );
    if (matched) return { automation, matchedKeyword: matched };
  }

  return null;
};

// ---------------------------------------------------------------------------
// Duplicate prevention
// ---------------------------------------------------------------------------

/**
 * Returns true if a DM has already been sent to this recipient for this
 * automation (one DM per person per campaign, ever).
 */
export const isDuplicate = async (
  automationId: string,
  recipientIgId: string
): Promise<boolean> => {
  const existing = await client.messageLog.findFirst({
    where: {
      automationId,
      recipientIgId,
      messageType: "DM",
      status: "SENT",
    },
  });
  return !!existing;
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export const createMessageLog = async (data: {
  automationId: string;
  recipientIgId: string;
  mediaId?: string;
  commentId?: string;
  messageType: MESSAGE_TYPE;
  status: SEND_STATUS;
  errorMessage?: string;
}) => {
  return await client.messageLog.create({
    data: {
      ...data,
      sentAt: data.status === "SENT" ? new Date() : undefined,
    },
  });
};

export const upsertLead = async (data: {
  automationId: string;
  igUserId: string;
  igUsername?: string;
  commentText?: string;
  mediaId?: string;
}) => {
  return await client.lead.upsert({
    where: {
      automationId_igUserId: {
        automationId: data.automationId,
        igUserId: data.igUserId,
      },
    },
    create: data,
    update: {
      igUsername: data.igUsername,
      commentText: data.commentText,
      mediaId: data.mediaId,
    },
  });
};

export const createAutomationEvent = async (data: {
  automationId: string;
  eventType: EVENT_TYPE;
  igUserId?: string;
  mediaId?: string;
  commentId?: string;
  keyword?: string;
  meta?: Record<string, unknown>;
}) => {
  return await client.automationEvent.create({ data });
};

// ---------------------------------------------------------------------------
// Counter tracking (kept from original — updates Listener.dmCount / commentCount)
// ---------------------------------------------------------------------------

export const trackResponse = async (
  automationId: string,
  type: "COMMENT" | "DM"
) => {
  const field = type === "COMMENT" ? "commentCount" : "dmCount";
  return await client.listener.update({
    where: { automationId },
    data: { [field]: { increment: 1 } },
  });
};

// ---------------------------------------------------------------------------
// SMARTAI chat history (kept from original — fixed parameter names)
// The original had sender/message/receiver swapped at call sites. Corrected here.
// pageId  = the IG Business Account ID (stored as senderId in Dms)
// messageText = the actual message string
// recipientIgId = the IG user ID who sent/receives the message
// ---------------------------------------------------------------------------

export const createChatHistory = (
  automationId: string,
  pageId: string,
  messageText: string,
  recipientIgId: string
) => {
  return client.automation.update({
    where: { id: automationId },
    data: {
      dms: {
        create: {
          senderId: pageId,
          message: messageText,
          reciever: recipientIgId,
        },
      },
    },
  });
};

// Thin wrapper used by the webhook for SMARTAI continuation lookups
export const findAutomationById = async (id: string) => {
  return await client.automation.findUnique({
    where: { id },
    include: {
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: { select: { token: true } },
        },
      },
    },
  });
};

export const getChatHistory = async (pageId: string, recipientIgId: string) => {
  const history = await client.dms.findMany({
    where: {
      AND: [{ senderId: pageId }, { reciever: recipientIgId }],
    },
    orderBy: { createdAt: "asc" },
  });

  const chatSession: { role: "assistant" | "user"; content: string }[] =
    history.map((chat) => ({
      role: chat.reciever ? "assistant" : "user",
      content: chat.message!,
    }));

  return {
    history: chatSession,
    automationId: history[history.length - 1]?.automationId ?? null,
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add actions/webhook/queries.ts
git commit -m "feat(webhook): rewrite queries with findAutomationForComment/DM, isDuplicate, createMessageLog, upsertLead, createAutomationEvent; fix createChatHistory param names"
```

---

## Task 7: Create canonical webhook app/api/webhooks/meta/route.ts

**Files:**
- Create: `app/api/webhooks/meta/route.ts`

This is the new public webhook handler. Note: `app/api/` is outside any route group and is NOT matched by Clerk middleware, so Meta's unauthenticated requests work correctly.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/abdou/Desktop/SAAS-Instagram-DM-Automations/app/api/webhooks/meta
```

- [ ] **Step 2: Create app/api/webhooks/meta/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  findAutomationForComment,
  findAutomationForDM,
  findAutomationById,
  isDuplicate,
  createMessageLog,
  upsertLead,
  createAutomationEvent,
  createChatHistory,
  getChatHistory,
  trackResponse,
} from "@/actions/webhook/queries";
import { matchKeywordWithMode } from "@/lib/matching";
import { sendDm, sendPrivateMessage, sendCommentReply } from "@/lib/fetch";
import { resolveTemplate } from "@/lib/template";
import { openai } from "@/lib/openai";

// ---------------------------------------------------------------------------
// GET — Meta webhook verification challenge
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Process Instagram comment and DM events
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    if (!entry) return ok();

    const igAccountId: string = entry.id;

    // -----------------------------------------------------------------------
    // COMMENT EVENT
    // -----------------------------------------------------------------------
    if (entry.changes?.[0]?.field === "comments") {
      const change = entry.changes[0].value;
      const mediaId: string | undefined = change.media?.id;
      const commentId: string | undefined = change.id;
      const commenterId: string | undefined = change.from?.id;
      const commenterUsername: string | undefined = change.from?.username;
      const commentText: string = change.text ?? "";

      if (!mediaId || !commentId || !commenterId || !commentText) return ok();

      // 1. Find active automation for this post
      const automation = await findAutomationForComment(mediaId, igAccountId);
      if (!automation?.listener) return ok();

      // 2. Match keyword using automation's matching mode
      const matchedKeyword = matchKeywordWithMode(
        commentText,
        automation.keywords,
        automation.matchingMode
      );

      if (!matchedKeyword) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "NO_MATCH",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: commentText.slice(0, 100),
        });
        return ok();
      }

      // 3. Log comment received
      await createAutomationEvent({
        automationId: automation.id,
        eventType: "COMMENT_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
        keyword: matchedKeyword,
      });

      // 4. Duplicate check — skip if we already DM'd this person for this automation
      if (await isDuplicate(automation.id, commenterId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        return ok();
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token) return ok();

      const listener = automation.listener;

      const templateVars = {
        username: commenterUsername ?? "",
        first_name: commenterUsername ?? "",
        keyword: matchedKeyword,
        link: listener.ctaLink ?? "",
      };

      // 5. Send public comment reply if configured
      if (listener.commentReply) {
        const replyText = resolveTemplate(listener.commentReply, templateVars);
        try {
          const replyResult = await sendCommentReply(commentId, replyText, token);
          const sent = replyResult.status === 200;
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: sent ? "SENT" : "FAILED",
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: sent ? "PUBLIC_REPLY_SENT" : "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            commentId,
            keyword: matchedKeyword,
          });
        } catch (err) {
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: "FAILED",
            errorMessage: String(err),
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            keyword: matchedKeyword,
            meta: { error: String(err) },
          });
        }
      }

      // 6. Send DM (private reply)
      const isSmartAi =
        listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
        } catch {
          // SMARTAI failed — fall through with the resolved prompt text
        }
      }

      try {
        const dmResult = await sendPrivateMessage(
          igAccountId,
          commentId,
          dmMessageText,
          token
        );
        const sent = dmResult.status === 200;
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        if (sent) {
          await upsertLead({
            automationId: automation.id,
            igUserId: commenterId,
            igUsername: commenterUsername,
            commentText,
            mediaId,
          });
          await trackResponse(automation.id, "COMMENT");
        }
      } catch (err) {
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: String(err),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: commenterId,
          keyword: matchedKeyword,
          meta: { error: String(err) },
        });
      }

      return ok();
    }

    // -----------------------------------------------------------------------
    // DM EVENT
    // -----------------------------------------------------------------------
    if (entry.messaging?.[0]) {
      const messaging = entry.messaging[0];
      const senderId: string | undefined = messaging.sender?.id;
      const dmText: string = messaging.message?.text ?? "";

      if (!senderId || !dmText) return ok();

      // 1. Try to match an automation
      const result = await findAutomationForDM(dmText, igAccountId);

      if (!result) {
        // No keyword match — check for ongoing SMARTAI conversation
        try {
          const chatHistory = await getChatHistory(igAccountId, senderId);
          if (chatHistory.history.length > 0 && chatHistory.automationId) {
            const automation = await findAutomationById(chatHistory.automationId);
            if (
              automation?.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO" &&
              process.env.OPENAI_API_KEY
            ) {
              const aiResp = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
                  },
                  ...chatHistory.history,
                  { role: "user", content: dmText },
                ],
              });
              const aiText = aiResp.choices[0].message.content;
              if (aiText && automation.User?.integrations?.[0]?.token) {
                await Promise.all([
                  createChatHistory(automation.id, igAccountId, dmText, senderId),
                  createChatHistory(automation.id, igAccountId, aiText, senderId),
                ]);
                await sendDm(igAccountId, senderId, aiText, automation.User.integrations[0].token);
              }
            }
          }
        } catch {
          // Non-critical — ignore errors in continuation path
        }
        return ok();
      }

      const { automation, matchedKeyword } = result;

      // 2. Duplicate check
      if (await isDuplicate(automation.id, senderId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        return ok();
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token || !automation.listener) return ok();

      const templateVars = {
        username: "",
        first_name: "",
        keyword: matchedKeyword,
        link: automation.listener.ctaLink ?? "",
      };

      const isSmartAi =
        automation.listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(automation.listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          await createChatHistory(automation.id, igAccountId, dmText, senderId);
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
          await createChatHistory(automation.id, igAccountId, dmMessageText, senderId);
        } catch {
          // fall through with resolved prompt
        }
      }

      try {
        const dmResult = await sendDm(igAccountId, senderId, dmMessageText, token);
        const sent = dmResult.status === 200;
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        if (sent) await trackResponse(automation.id, "DM");
      } catch (err) {
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: String(err),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
          meta: { error: String(err) },
        });
      }

      return ok();
    }

    return ok();
  } catch (error) {
    // Never return 5xx to Meta — always acknowledge receipt
    console.error("[Webhook] Unhandled error:", error);
    return ok();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok() {
  return NextResponse.json({ received: true }, { status: 200 });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/meta/route.ts
git commit -m "feat(webhook): add canonical public webhook at /api/webhooks/meta with Meta verify_token, duplicate prevention, template vars, public reply, and full event logging"
```

---

## Task 8: Remove old webhook route

**Files:**
- Delete: `app/(protected)/api/webhook/instagram/route.ts`
- Delete: `app/(protected)/api/webhook/` (directory)

- [ ] **Step 1: Delete the old webhook file and directory**

```bash
rm -rf /Users/abdou/Desktop/SAAS-Instagram-DM-Automations/app/\(protected\)/api/webhook
```

- [ ] **Step 2: Verify the directory is gone**

```bash
ls /Users/abdou/Desktop/SAAS-Instagram-DM-Automations/app/\(protected\)/api/
```

Expected: Only `payment/` remains; `webhook/` is gone.

- [ ] **Step 3: Verify the new webhook route exists**

```bash
ls /Users/abdou/Desktop/SAAS-Instagram-DM-Automations/app/api/webhooks/meta/
```

Expected: `route.ts`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated webhook at (protected)/api/webhook/instagram — replaced by app/api/webhooks/meta"
```

---

## Task 9: Update actions/automation/queries.ts

**Files:**
- Modify: `actions/automation/queries.ts`

Two changes: (1) update `addListener` to accept and save `ctaLink`, (2) add `getAutomationAnalytics`.

- [ ] **Step 1: Update addListener to accept ctaLink**

Find the existing `addListener` function and replace it:

```typescript
export const addListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string,
  ctaLink?: string
) => {
  return await client.automation.update({
    where: { id: automationId },
    data: {
      listener: {
        create: {
          listener,
          prompt,
          commentReply: reply,
          ctaLink,
        },
      },
    },
  });
};
```

- [ ] **Step 2: Update saveListener in actions/automation/index.ts to forward ctaLink**

Find `saveListener` and replace:

```typescript
export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string,
  ctaLink?: string
) => {
  await onCurrentUser();

  try {
    const create = await addListener(automationId, listener, prompt, reply, ctaLink);
    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Failed to create listener" };
  } catch (error) {
    return { status: 500, data: "Failed to save listener" };
  }
};
```

- [ ] **Step 3: Add getAutomationAnalytics to actions/automation/queries.ts**

Add this function at the end of `actions/automation/queries.ts`:

```typescript
export const getAutomationAnalytics = async (automationId: string) => {
  const [dmsSent, dmsFailed, repliesSent, repliesFailed, leadsCount, commentsReceived] =
    await Promise.all([
      client.messageLog.count({ where: { automationId, messageType: "DM", status: "SENT" } }),
      client.messageLog.count({ where: { automationId, messageType: "DM", status: "FAILED" } }),
      client.messageLog.count({
        where: { automationId, messageType: "COMMENT_REPLY", status: "SENT" },
      }),
      client.messageLog.count({
        where: { automationId, messageType: "COMMENT_REPLY", status: "FAILED" },
      }),
      client.lead.count({ where: { automationId } }),
      client.automationEvent.count({
        where: { automationId, eventType: "COMMENT_RECEIVED" },
      }),
    ]);

  return { commentsReceived, dmsSent, dmsFailed, repliesSent, repliesFailed, leadsCollected: leadsCount };
};
```

- [ ] **Step 4: Commit**

```bash
git add actions/automation/queries.ts actions/automation/index.ts
git commit -m "feat(automation): addListener accepts ctaLink; add getAutomationAnalytics from MessageLog data"
```

---

## Task 10: TypeScript check and run all tests

- [ ] **Step 1: Run all unit tests**

```bash
cd /Users/abdou/Desktop/SAAS-Instagram-DM-Automations && npx vitest run --reporter=verbose
```

Expected: All tests in `lib/matching.test.ts` and `lib/template.test.ts` pass. Total should be ~14 tests.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Review any errors. Common issues to fix:

- **Prisma enum imports:** If `MATCHING_MODE`, `EVENT_TYPE`, etc. are not found, run `npx prisma generate` first.
- **Missing return type on client_findAutomationById:** TypeScript may infer `Promise<... | null>` — this is fine.
- **`automation.matchingMode` type:** Prisma generates the enum type; make sure the import in `lib/matching.ts` matches `@prisma/client`'s export.

- [ ] **Step 3: Regenerate Prisma client if needed**

```bash
npx prisma generate && npx tsc --noEmit 2>&1
```

- [ ] **Step 4: Fix any TypeScript errors surfaced**

If `getChatHistory` returns `automationId: null` (when history is empty) instead of a string, the `findAutomationById(chatHistory.automationId)` call will error. The condition `chatHistory.automationId` already guards against this since `null` is falsy.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: fix TypeScript errors after Phase 1 changes; all unit tests passing"
```

---

## Post-Plan Notes

### What still needs real Meta credentials to test end-to-end

1. **Instagram OAuth flow** — requires a real `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, and `INSTAGRAM_EMBEDDED_OAUTH_URL` from Meta Developer Console.
2. **Webhook events** — use [ngrok](https://ngrok.com/) locally: `ngrok http 3000`. Then set your Meta App's webhook callback URL to `https://<ngrok-id>.ngrok.io/api/webhooks/meta` and verify token to match `META_VERIFY_TOKEN` in `.env.local`.
3. **sendCommentReply** — requires the `instagram_manage_comments` permission scope on your Meta App.
4. **sendPrivateMessage** — requires `instagram_manage_messages` permission.
5. **sendDm (messaging DM trigger)** — requires `instagram_manage_messages` + Messenger Platform enabled on your Meta App.

### Next commands to run after implementation

```bash
# 1. Install new dep
npm install

# 2. Run DB migration
npx prisma migrate dev --name phase1-schema

# 3. Run unit tests
npm test

# 4. TypeScript check
npx tsc --noEmit

# 5. Start dev server
npm run dev
```

### Phase 2 items (not in this plan)
- Premium landing page (ReplyFlow AI brand, dark theme, Linear/Stripe-inspired)
- Automation wizard UI (step-by-step create flow)
- 3-tier pricing (Free / Creator / Agency) with Stripe
- Dashboard analytics UI using `getAutomationAnalytics`
- Automation list page polish
- `matchingMode` selector in create/edit automation UI
- `ctaLink` input in create/edit automation UI
