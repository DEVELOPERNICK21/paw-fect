import type { PetHealthCardViewModel } from '../../../domain/models/PetHealthCardViewModel';
import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
} from '../../../domain/models/PetHealthCardViewModel';

export function shareCardKicker(): string {
  return 'Pet health update';
}

export function shareCardTagline(): string {
  return 'A simple summary anyone can read';
}

export function shareCardSectionTitle(): string {
  return 'What is due next';
}

export function shareCardIntro(viewModel: PetHealthCardViewModel): string {
  if (viewModel.snapshot.kind === 'empty') {
    return `Paw-fect is setting up ${viewModel.pet.name}'s vaccine and deworming schedule.`;
  }

  const overdue = viewModel.snapshot.items.find(item => item.status === 'overdue');
  if (overdue) {
    return `${plainTaskName(overdue.label)} is overdue. Share this card so helpers know what to book next.`;
  }

  const next = viewModel.snapshot.items.find(item => item.status !== 'done');
  if (next) {
    return `These are the health tasks Paw-fect is tracking for ${viewModel.pet.name}.`;
  }

  return `${viewModel.pet.name} is up to date. This card shows the latest care logged in Paw-fect.`;
}

export function shareCardFooterCta(): string {
  return 'Get the Paw-fect app';
}

export function shareCardFooterHint(): string {
  return 'Anyone with this card can see what care is coming up.';
}

export function plainTaskName(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('deworm')) {
    return 'Deworming treatment';
  }
  if (normalized.includes('rabies')) {
    return 'Rabies vaccine';
  }
  if (normalized.includes('vaccin')) {
    return 'Vaccination';
  }
  return label;
}

export function plainStatusLine(item: PetHealthCardItem): string {
  if (item.status === 'done') {
    return `Completed: ${item.detail}`;
  }
  if (item.status === 'overdue') {
    return 'Overdue - please schedule this soon';
  }
  return item.detail;
}

export function statusChipLabel(status: PetHealthCardItemStatus): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'due_in':
      return 'Upcoming';
    case 'overdue':
      return 'Overdue';
  }
}

export function careIcon(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('rabies')) {
    return '🛡️';
  }
  if (
    normalized.includes('vaccin') ||
    normalized.includes('dhpp') ||
    normalized.includes('fvrcp')
  ) {
    return '💉';
  }
  if (normalized.includes('deworm')) {
    return '💊';
  }
  return '🐾';
}

export function glanceStats(
  viewModel: PetHealthCardViewModel,
): Array<{ label: string; value: string }> {
  if (viewModel.snapshot.kind === 'empty') {
    return [
      { label: 'Schedule', value: 'Setting up' },
      { label: 'Share', value: 'Ready now' },
    ];
  }

  const items = viewModel.snapshot.items;
  const doneCount = items.filter(item => item.status === 'done').length;
  const next = items.find(item => item.status !== 'done');
  const overdueCount = items.filter(item => item.status === 'overdue').length;

  return [
    {
      label: 'Next care',
      value: next ? next.detail : 'All clear',
    },
    {
      label: 'Finished',
      value: doneCount > 0 ? `${doneCount} task${doneCount === 1 ? '' : 's'}` : 'None yet',
    },
    {
      label: 'Overall',
      value: overdueCount > 0 ? 'Needs attention' : 'On track',
    },
  ];
}
