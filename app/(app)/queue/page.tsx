import { redirect } from "next/navigation";

export default function CallQueuePage() {
  redirect("/calls?view=queue");
}
