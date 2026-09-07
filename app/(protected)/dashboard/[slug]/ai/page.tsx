import { getAiWorkspace } from "@/actions/ai-workspace";
import Ap3kAiConsole from "@/components/ai/ap3k-ai-console";

export default async function Ap3kAiPage({ params }: { params: { slug: string } }) {
  const data = await getAiWorkspace();
  return <Ap3kAiConsole slug={params.slug} initial={data.profile} plan={data.plan} />;
}
