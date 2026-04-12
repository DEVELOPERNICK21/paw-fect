import { countActivePlans } from "@/lib/data/pricing";
import { countUnreadContacts } from "@/lib/data/contacts";
import {
  countWaitlistThisWeek,
  countWaitlistTotal,
} from "@/lib/data/waitlist";

export interface DashboardStats {
  waitlistTotal: number;
  waitlistThisWeek: number;
  unreadContacts: number;
  activePlans: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [waitlistTotal, waitlistThisWeek, unreadContacts, activePlans] =
      await Promise.all([
        countWaitlistTotal(),
        countWaitlistThisWeek(),
        countUnreadContacts(),
        countActivePlans(),
      ]);
    return {
      waitlistTotal,
      waitlistThisWeek,
      unreadContacts,
      activePlans,
    };
  } catch {
    return {
      waitlistTotal: 0,
      waitlistThisWeek: 0,
      unreadContacts: 0,
      activePlans: 0,
    };
  }
}
