import { ContentEditor } from "@/components/admin/ContentEditor";
import { getSiteContentMarketing } from "@/lib/data/site-content";

export default async function AdminContentPage(): Promise<React.ReactElement> {
  const initial = await getSiteContentMarketing();
  return <ContentEditor initial={initial} />;
}
