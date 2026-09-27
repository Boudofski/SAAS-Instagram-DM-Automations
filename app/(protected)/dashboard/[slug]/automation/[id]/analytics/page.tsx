import { notFound } from "next/navigation";
import { onGetAutomationAnalytics } from "@/actions/automation/analytics";
import AutomationAnalyticsView from "@/components/automations/automation-analytics";
export default async function Page({params}:{params:{slug:string;id:string}}){
  const data=await onGetAutomationAnalytics(params.id);
  if(!data)notFound();
  return <AutomationAnalyticsView data={data} slug={params.slug}/>;
}
