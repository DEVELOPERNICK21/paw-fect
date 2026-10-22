/**
 * Emitted once a care task has genuinely become completed: it was saved, and it
 * was not already completed. Never emitted for failed saves, repeats, undo, or
 * when there is no signed-in user / schedule.
 */
export interface CareTaskCompletedEvent {
  type: 'care-task-completed';
  petId: string;
  blockId: string;
  /** Local calendar day (YYYY-MM-DD) the task belongs to. */
  date: string;
  /**
   * `true` only the first time every task for this pet's day is done, so a
   * celebration is not repeated if tasks are un-done and re-done the same day.
   */
  dayCompleted: boolean;
}

export type CareCompletionEvent = CareTaskCompletedEvent;
