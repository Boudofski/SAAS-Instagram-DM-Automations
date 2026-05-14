import { onIntegrate } from "@/actions/integration";
import { redirect } from "next/navigation";

type Props = {
  searchParams: {
    code: string;
  };
};

async function Page({ searchParams: { code } }: Props) {
  if (code) {
    const user = await onIntegrate(code.split("#_")[0]);

    if (user.status === 200) {
      const slug =
        `${user.data?.firstname ?? ""}${user.data?.lastname ?? ""}` ||
        user.data?.clerkId ||
        "";
      return redirect(
        slug ? `/dashboard/${slug}/integrations` : "/dashboard"
      );
    }
  }

  return redirect("/dashboard");
}

export default Page;
