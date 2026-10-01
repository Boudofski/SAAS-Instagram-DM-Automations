import { attachmentScopeFilter } from "@/lib/attachment-scope";
import {
  attachmentUser,
  attachmentDto,
  attachmentSelection,
} from "@/lib/attachment-storage";
import { client } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await attachmentUser();
    const files = await client.automationAttachment.findMany({
      where: { userId: user.id, status: "READY", ...attachmentScopeFilter() },
      select: attachmentSelection,
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return Response.json({ files: files.map(attachmentDto) });
  } catch {
    return Response.json(
      { error: "Sign in to view your attachments." },
      { status: 401 },
    );
  }
}
