import { beforeEach, afterEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  send: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  profile: vi.fn(),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mock.send };
  },
}));
vi.mock("@/lib/prisma", () => ({
  client: {
    emailDelivery: {
      findFirst: mock.findFirst,
      findUnique: mock.findUnique,
      create: mock.create,
      updateMany: mock.updateMany,
    },
    user: { findUnique: mock.profile },
    emailPreference: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));
vi.mock("@/lib/ai-reply", () => ({ generateAiEmailPersonalization: vi.fn() }));
import { sendAp3kEmail } from "./delivery";
const input = {
  templateId: "welcome" as const,
  userId: "u1",
  to: "customer@example.com",
  idempotencyKey: "welcome-u1",
};
const payload = {
  from: "AP3K <updates@ap3k.com>",
  to: "customer@example.com",
  subject: "Frozen subject",
  html: "<p>Frozen message</p>",
};
function row(attempts = 1, age = 120000) {
  return {
    id: "delivery",
    idempotencyKey: "ap3k:welcome-u1",
    metadata: { servicePayload: payload, serviceAttempts: attempts },
    createdAt: new Date(Date.now() - age),
    updatedAt: new Date(Date.now() - 120000),
    errorCode: "service_retry",
    status: "FAILED",
    providerMessageId: null,
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  mock.findFirst.mockResolvedValue(null);
  mock.findUnique.mockResolvedValue(null);
  mock.profile.mockResolvedValue({ preferredLocale: "ar" });
  mock.updateMany.mockResolvedValue({ count: 1 });
  mock.send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  mock.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: "delivery",
    createdAt: new Date(),
    updatedAt: new Date(),
    errorCode: null,
  }));
});
afterEach(() => vi.unstubAllEnvs());
it("renders in the saved account language and persists the exact payload before sending", async () => {
  expect((await sendAp3kEmail(input)).status).toBe("sent");
  const stored = mock.create.mock.calls[0][0].data.metadata.servicePayload;
  expect(stored.html).toContain('dir="rtl"');
  expect(stored.html).toContain('lang="ar"');
  expect(mock.send).toHaveBeenCalledWith(stored, {
    idempotencyKey: "ap3k:welcome-u1",
  });
});
it("retries with the original content and idempotency key", async () => {
  mock.findUnique.mockResolvedValue(row());
  await sendAp3kEmail(input);
  expect(mock.send).toHaveBeenCalledWith(payload, {
    idempotencyKey: "ap3k:welcome-u1",
  });
  expect(mock.create).not.toHaveBeenCalled();
  expect(mock.profile).not.toHaveBeenCalled();
});
it("does not send when another worker owns the delivery", async () => {
  mock.findUnique.mockResolvedValue(row());
  mock.updateMany.mockResolvedValue({ count: 0 });
  expect((await sendAp3kEmail(input)).status).toBe("duplicate");
  expect(mock.send).not.toHaveBeenCalled();
});
it("stops retrying outside the idempotency window or after three attempts", async () => {
  for (const existing of [row(1, 24 * 3600000), row(3)]) {
    mock.findUnique.mockResolvedValue(existing);
    expect((await sendAp3kEmail(input)).status).toBe("failed");
  }
  expect(mock.send).not.toHaveBeenCalled();
});
it("respects recipient suppression", async () => {
  mock.findFirst.mockResolvedValue({ id: "bounce" });
  expect((await sendAp3kEmail(input)).status).toBe("opted_out");
  expect(mock.send).not.toHaveBeenCalled();
});
it("retains a retryable failure without reporting a successful send", async () => {
  mock.send.mockRejectedValue(new Error("Connection interrupted"));
  expect((await sendAp3kEmail(input)).status).toBe("failed");
  expect(mock.updateMany).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "FAILED",
        errorCode: "service_retry",
      }),
    }),
  );
});
