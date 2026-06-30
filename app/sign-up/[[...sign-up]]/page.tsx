import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth";

export default function Page() {
  if (!clerkEnabled) redirect("/");
  return <SignUp />;
}
