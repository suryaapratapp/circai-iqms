import { redirect } from "next/navigation";

export default async function InboundPage() {
  redirect("/receive");
}
