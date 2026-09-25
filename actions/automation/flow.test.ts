import { beforeEach, describe, it, expect, vi } from "vitest";
const m = vi.hoisted(() => ({
  current: vi.fn(),
  scope: vi.fn(),
  quota: vi.fn(),
  user: vi.fn(),
  integration: vi.fn(),
  existing: vi.fn(),
  image: vi.fn(),
  transaction: vi.fn(),
  revision: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("@/actions/user", () => ({ onCurrentUser: m.current }));
vi.mock("@/lib/instagram-account-scope", () => ({
  currentInstagramAccountId: m.scope,
}));
vi.mock("@/actions/usage/queries", () => ({ canActivateCampaign: m.quota }));
vi.mock("@/lib/prisma", () => ({
  client: {
    user: { findUnique: m.user },
    integrations: { findFirst: m.integration },
    automation: { findFirst: m.existing },
    automationImage: { findFirst: m.image },
    $transaction: m.transaction,
  },
}));
import { saveAutomationFlow, type SaveFlowInput } from "./flow";
import { templateFlow } from "@/lib/automation-flow/templates";
const id = "12345678-1234-1234-1234-123456789012";
const input: SaveFlowInput = {
  integrationId: id,
  revision: 0,
  name: "Email flow",
  active: false,
  source: "DM",
  storyTrigger: "REPLY",
  keyword: "EBOOK",
  anyMessage: false,
  post: null,
  opening: "Continue?",
  openingButton: "Continue",
  publicReply: "",
  flow: configuredEmail(),
};
beforeEach(() => {
  vi.resetAllMocks();
  m.current.mockResolvedValue({ id: "clerk" });
  m.scope.mockResolvedValue(id);
  m.user.mockResolvedValue({
    id: "owner",
    status: "ACTIVE",
    subscription: { plan: "PRO" },
  });
  m.integration.mockResolvedValue({ id, userId: "owner", status: "CONNECTED" });
  m.quota.mockResolvedValue({ ok: true });
  m.revision.mockResolvedValue({ count: 1 });
  m.upsert.mockResolvedValue({ id });
  m.update.mockResolvedValue({ id });
  m.transaction.mockImplementation(async (callback) =>
    callback({
      listener: { updateMany: m.revision },
      automation: { upsert: m.upsert, update: m.update },
      keyword: { deleteMany: m.clear },
      post: { deleteMany: m.clear },
      trigger: { deleteMany: m.clear },
      automationFlowSession: { updateMany: m.clear },
    }),
  );
});
describe("custom flow save authorization", () => {
  it("rejects a switched account without writing", async () => {
    expect(
      await saveAutomationFlow({
        ...input,
        integrationId: "22345678-1234-1234-1234-123456789012",
      }),
    ).toMatchObject({ status: 409 });
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("does not update another account automation", async () => {
    m.existing.mockResolvedValue(null);
    expect(await saveAutomationFlow({ ...input, id })).toMatchObject({
      status: 404,
    });
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("lets Free save a draft but not publish", async () => {
    m.user.mockResolvedValue({
      id: "owner",
      status: "ACTIVE",
      subscription: { plan: "FREE" },
    });
    expect(await saveAutomationFlow(input)).toMatchObject({
      status: 200,
      revision: 1,
    });
    expect(await saveAutomationFlow({ ...input, active: true })).toMatchObject({
      status: 403,
    });
  });
  it("requires a usable Instagram account when publishing", async () => {
    m.integration.mockResolvedValue({
      id,
      status: "CONNECTED",
      planLocked: true,
    });
    expect(await saveAutomationFlow({ ...input, active: true })).toMatchObject({
      status: 403,
    });
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("rejects invalid graphs before writes", async () => {
    const flow = templateFlow();
    flow.entry = "missing";
    expect(await saveAutomationFlow({ ...input, flow })).toMatchObject({
      status: 400,
    });
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("rejects simultaneous editing with a stale revision", async () => {
    m.existing.mockResolvedValue({
      id,
      listener: { flowDefinition: input.flow },
    });
    m.revision.mockResolvedValue({ count: 0 });
    expect(
      await saveAutomationFlow({ ...input, id, revision: 1 }),
    ).toMatchObject({ status: 409 });
    expect(m.update).not.toHaveBeenCalled();
  });
  it("cancels waiting sessions when a flow is edited", async () => {
    m.existing.mockResolvedValue({
      id,
      listener: { flowDefinition: input.flow },
    });
    expect(
      await saveAutomationFlow({ ...input, id, revision: 4 }),
    ).toMatchObject({ status: 200, revision: 5 });
    expect(m.clear).toHaveBeenCalledWith({
      where: { automationId: id },
      data: { status: "CANCELLED" },
    });
  });
  it("requires a post for comment flows", async () => {
    expect(
      await saveAutomationFlow({ ...input, source: "COMMENT" }),
    ).toMatchObject({ status: 400 });
    expect(m.transaction).not.toHaveBeenCalled();
  });
});

function configuredEmail() {
  const flow = templateFlow("email");
  for (const node of flow.nodes)
    if (node.kind === "message")
      node.links = [
        { label: "Get resource", url: "https://ap3k.com/resource" },
      ];
  return flow;
}
