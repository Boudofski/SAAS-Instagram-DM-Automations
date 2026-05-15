import { onboardUser } from "@/actions/user";
import { dashboardPath } from "@/lib/dashboard";
import { redirect } from "next/navigation";

type Props = {};

async function Page({}: Props) {
  const user = await onboardUser();

  if (user.status === 200 || user.status === 201) {
    return redirect(dashboardPath(user.data?.clerkId));
  }

  return redirect("/sign-in");
}

export default Page;
