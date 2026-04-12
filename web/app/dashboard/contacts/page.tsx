import { ContactsTable } from "@/components/admin/ContactsTable";
import { listContacts } from "@/lib/data/contacts";

export default async function AdminContactsPage(): Promise<React.ReactElement> {
  const contacts = await listContacts({ limit: 200 });
  return <ContactsTable initial={contacts} />;
}
