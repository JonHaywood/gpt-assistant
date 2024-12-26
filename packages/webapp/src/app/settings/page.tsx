import { redirect } from "next/navigation";

export default async function Page() {
  redirect("/settings/api-keys");
}
