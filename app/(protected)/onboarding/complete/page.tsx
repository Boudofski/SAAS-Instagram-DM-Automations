import { redirect } from "next/navigation";

export default async function OnboardingCompletePage() {
  redirect("/dashboard");
}
