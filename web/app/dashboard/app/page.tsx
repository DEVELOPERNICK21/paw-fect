import { AppMetricsSection } from "@/components/admin/AppMetricsSection";
import { getAppMetrics } from "@/lib/data/app-metrics";

export default async function AppMetricsPage(): Promise<React.ReactElement> {
  const metrics = await getAppMetrics();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        App metrics
      </h1>
      <p className="mt-1 text-stone-600 dark:text-stone-400">
        Detailed mobile app usage and subscription breakdown.
      </p>
      <AppMetricsSection metrics={metrics} showHeading={false} />
    </div>
  );
}
