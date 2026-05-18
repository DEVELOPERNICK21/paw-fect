import { AppMetricsSection } from "@/components/admin/AppMetricsSection";
import { Card } from "@/components/ui/Card";
import { getDashboardStats } from "@/lib/data/dashboard-stats";

export default async function DashboardOverviewPage(): Promise<React.ReactElement> {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">Overview</h1>
      <p className="mt-1 text-stone-600 dark:text-stone-400">
        Marketing site and mobile app metrics from Firestore.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          Marketing site
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-stone-500">Waitlist total</p>
            <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.waitlistTotal}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-stone-500">New this week</p>
            <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.waitlistThisWeek}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-stone-500">Unread contacts</p>
            <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.unreadContacts}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-stone-500">Active pricing plans</p>
            <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
              {stats.activePlans}
            </p>
          </Card>
        </div>
      </section>

      <AppMetricsSection metrics={stats.app} />
    </div>
  );
}
