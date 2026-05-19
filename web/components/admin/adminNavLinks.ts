import type { LucideIcon } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Smartphone,
  Tag,
  Users,
} from "lucide-react";

export interface AdminNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const adminNavLinks: AdminNavLink[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/app", label: "App metrics", icon: Smartphone },
  { href: "/dashboard/pricing", label: "Pricing plans", icon: Tag },
  { href: "/dashboard/content", label: "Site content", icon: FileText },
  { href: "/dashboard/waitlist", label: "Waitlist", icon: Users },
  { href: "/dashboard/contacts", label: "Contacts", icon: Mail },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function adminNavLabelForPath(pathname: string): string {
  const match = adminNavLinks.find(link => isAdminNavActive(pathname, link.href));
  return match?.label ?? "Admin";
}
