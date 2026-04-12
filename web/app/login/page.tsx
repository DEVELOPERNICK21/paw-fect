import { LoginForm } from "@/components/admin/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}): React.ReactElement {
  const callbackUrl = searchParams.callbackUrl ?? "/dashboard";
  return <LoginForm callbackUrl={callbackUrl} />;
}
