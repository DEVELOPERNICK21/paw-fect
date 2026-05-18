import { Card } from "@/components/ui/Card";
import type { AppMetrics } from "@/lib/data/app-metrics";
import {
  PLAN_CARE_PLUS,
  PLAN_FAMILY,
  PLAN_FREE,
} from "@repo-shared/subscription/planCatalog";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}): React.ReactElement {
  return (
    <Card>
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-500">{hint}</p>
      ) : null}
    </Card>
  );
}

export function AppMetricsSection({
  metrics,
  showHeading = true,
}: {
  metrics: AppMetrics;
  showHeading?: boolean;
}): React.ReactElement {
  const gridClass = `grid gap-4 sm:grid-cols-2 lg:grid-cols-4${showHeading ? " mt-6" : ""}`;

  return (
    <section className={showHeading ? "mt-12" : "mt-6"}>
      {showHeading ? (
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Mobile app
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Pet parents, pets, and subscriptions from Firestore (live app data).
          </p>
        </div>
      ) : null}

      <div className={gridClass}>
        <StatCard
          label="Registered pet parents"
          value={metrics.registeredUsers}
          hint="Firebase user profiles"
        />
        <StatCard
          label="Pet parents with pets"
          value={metrics.usersWithPets}
        />
        <StatCard
          label="Total pets"
          value={metrics.totalPets}
          hint={`${metrics.petsAddedThisWeek} added this week`}
        />
        <StatCard
          label="Avg pets per parent"
          value={metrics.avgPetsPerPetParent}
          hint="Among parents with at least one pet"
        />
        <StatCard
          label="Active paid subscriptions"
          value={metrics.activePaidSubscribers}
          hint={`Razorpay ${metrics.paidByProvider.razorpay} · Google Play ${metrics.paidByProvider.google_play}`}
        />
        <StatCard label="Active trials" value={metrics.activeTrialUsers} />
        <StatCard label="Free tier" value={metrics.freeUsers} />
        <StatCard
          label="Onboarding completed"
          value={metrics.onboardingCompleted}
          hint={`${metrics.newUsersThisWeek} new sign-ups this week`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Plan distribution
          </p>
          <ul className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-400">
            <li className="flex justify-between">
              <span>Free</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {metrics.planBreakdown[PLAN_FREE]}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Care+</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {metrics.planBreakdown[PLAN_CARE_PLUS]}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Family</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100">
                {metrics.planBreakdown[PLAN_FAMILY]}
              </span>
            </li>
          </ul>
        </Card>
        <Card>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            How counts work
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-600 dark:text-stone-400">
            <li>
              <strong className="text-stone-800 dark:text-stone-200">Paid</strong>{" "}
              — active or authenticated subscription, including grace period.
            </li>
            <li>
              <strong className="text-stone-800 dark:text-stone-200">Trial</strong>{" "}
              — trial not consumed and still within trial window.
            </li>
            <li>
              Pets are stored under{" "}
              <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">
                users/&#123;uid&#125;/pets
              </code>
              .
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
