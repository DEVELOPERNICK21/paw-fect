import { WaitlistTable } from "@/components/admin/WaitlistTable";
import { listWaitlist } from "@/lib/data/waitlist";

export default async function AdminWaitlistPage(): Promise<React.ReactElement> {
  const entries = await listWaitlist({ limit: 200 });
  return <WaitlistTable initial={entries} />;
}
