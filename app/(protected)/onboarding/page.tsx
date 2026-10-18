import { redirect } from "next/navigation";

export default async function OnboardingWelcomePage() {
  redirect("/dashboard");
}
