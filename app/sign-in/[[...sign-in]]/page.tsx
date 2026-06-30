import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";

export default function Page() {
  if (!clerkEnabled) redirect("/");
  return <SignIn />;
}
