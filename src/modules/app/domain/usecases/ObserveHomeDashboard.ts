import type { Pet } from '../../../pets/domain/models/Pet';
import type { PetRepository } from '../../../pets/domain/repositories/PetRepository';
import type { ReminderRepository } from '../../../reminders/domain/repositories/ReminderRepository';
import type { HealthRecordRepository } from '../../../records/domain/repositories/HealthRecordRepository';
import type { SmartHealthRecord } from '../../../records/domain/models/SmartHealthRecord';
import type { SmartHealthRecordRepository } from '../../../records/domain/repositories/SmartHealthRecordRepository';
import type { HomeDashboardInvalidationPort } from '../ports/HomeDashboardInvalidationPort';
import type { HomeDashboardObserver, ObserveHomeDashboardPort } from '../ports/ObserveHomeDashboardPort';
import { BuildHomeDashboardViewModel } from './BuildHomeDashboardViewModel';

/**
 * Pulls dashboard data from repositories (SSOT) and rebuilds the view model.
 * Re-runs when {@link HomeDashboardInvalidationPort} notifies (explicit flow, no store coupling).
 */
export class ObserveHomeDashboard implements ObserveHomeDashboardPort {
  constructor(
    private readonly petRepository: PetRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly healthRecordRepository: HealthRecordRepository,
    private readonly smartHealthRecordRepository: SmartHealthRecordRepository,
    private readonly buildHomeDashboardViewModel: BuildHomeDashboardViewModel,
    private readonly getCurrentUserId: () => string | null,
    private readonly invalidation: HomeDashboardInvalidationPort,
  ) {}

  execute() {
    return {
      subscribe: (observer: HomeDashboardObserver) => {
        let cancelled = false;
        let inFlight = false;

        const pull = async () => {
          if (cancelled || inFlight) {
            return;
          }
          inFlight = true;
          try {
            const userId = this.getCurrentUserId();
            if (!userId) {
              if (!cancelled) {
                observer.next(
                  this.buildHomeDashboardViewModel.execute({
                    now: new Date(),
                    petsLoading: false,
                    pets: [],
                    activePet: null,
                    reminders: [],
                    remindersLoading: false,
                    records: [],
                    smartHealthRecords: [],
                    lastError: null,
                    isRefreshing: false,
                  }),
                );
              }
              return;
            }

            const [pets, reminders, records, activePetId] = await Promise.all([
              this.petRepository.getPets(userId),
              this.reminderRepository.getReminders(),
              this.healthRecordRepository.getRecords(),
              this.petRepository.getActivePetId(userId),
            ]);

            const activePet = this.resolveDisplayActivePet(pets, activePetId);

            let smartHealthRecords: SmartHealthRecord[] = [];
            if (activePet != null) {
              try {
                smartHealthRecords =
                  await this.smartHealthRecordRepository.listByPet(
                    userId,
                    activePet.id,
                  );
              } catch {
                smartHealthRecords = [];
              }
            }

            const vm = this.buildHomeDashboardViewModel.execute({
              now: new Date(),
              petsLoading: false,
              pets,
              activePet,
              reminders,
              remindersLoading: false,
              records,
              smartHealthRecords,
              lastError: null,
              isRefreshing: false,
            });

            if (!cancelled) {
              observer.next(vm);
            }
          } catch {
            if (!cancelled) {
              observer.next(
                this.buildHomeDashboardViewModel.execute({
                  now: new Date(),
                  petsLoading: false,
                  pets: [],
                  activePet: null,
                  reminders: [],
                  remindersLoading: false,
                  records: [],
                  smartHealthRecords: [],
                  lastError: 'Unable to load dashboard.',
                  isRefreshing: false,
                }),
              );
            }
          } finally {
            inFlight = false;
          }
        };

        void pull();

        const offInvalidate = this.invalidation.subscribe(() => {
          void pull();
        });

        return {
          unsubscribe: () => {
            cancelled = true;
            offInvalidate();
          },
        };
      },
    };
  }

  /**
   * Read-only resolution for the dashboard. Does not persist a new active pet (that remains pet module responsibility on load).
   */
  private resolveDisplayActivePet(pets: Pet[], activePetId: string | null): Pet | null {
    let active: Pet | null =
      activePetId != null ? pets.find(p => p.id === activePetId) ?? null : null;
    if (active == null && pets.length > 0) {
      active = pets[0] ?? null;
    }
    return active;
  }
}
