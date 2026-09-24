import { GET as getImage } from "@/app/api/automation-images/[id]/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { filename: string } }) {
  if (!params.filename.endsWith(".jpg")) return new Response(null, { status: 404 });
  return getImage(request, { params: { id: params.filename.slice(0, -4) } });
}
