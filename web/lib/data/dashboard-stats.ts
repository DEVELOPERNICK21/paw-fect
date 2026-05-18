import { getAppMetrics, type AppMetrics } from "@/lib/data/app-metrics";
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
  app: AppMetrics;
}

export type { AppMetrics };

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [waitlistTotal, waitlistThisWeek, unreadContacts, activePlans, app] =
      await Promise.all([
        countWaitlistTotal(),
        countWaitlistThisWeek(),
        countUnreadContacts(),
        countActivePlans(),
        getAppMetrics(),
      ]);
    return {
      waitlistTotal,
      waitlistThisWeek,
      unreadContacts,
      activePlans,
      app,
    };
  } catch {
    return {
      waitlistTotal: 0,
      waitlistThisWeek: 0,
      unreadContacts: 0,
      activePlans: 0,
      app: await getAppMetrics(),
    };
  }
}
