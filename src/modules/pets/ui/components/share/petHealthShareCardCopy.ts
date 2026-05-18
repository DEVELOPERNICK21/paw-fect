import type { PetHealthCardViewModel } from '../../../domain/models/PetHealthCardViewModel';
import type {
  PetHealthCardItem,
  PetHealthCardItemStatus,
} from '../../../domain/models/PetHealthCardViewModel';

export function shareCardKicker(): string {
  return 'Pet health update';
}

export function shareCardTagline(): string {
  return 'The update pet parents love to share';
}

export function shareCardSectionTitle(): string {
  return 'Care parents notice';
}

export function shareCardHighlightsSectionTitle(): string {
  return 'Worth sharing';
}

export function shareCardPetSubline(viewModel: PetHealthCardViewModel): string | null {
  const parts: string[] = [];
  if (viewModel.pet.speciesLabel) {
    parts.push(viewModel.pet.speciesLabel);
  }
  if (viewModel.pet.breedLabel) {
    parts.push(viewModel.pet.breedLabel);
  }
  if (viewModel.pet.ageLabel) {
    parts.push(viewModel.pet.ageLabel);
  }
  if (viewModel.pet.genderLabel) {
    parts.push(viewModel.pet.genderLabel);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function shareCardIntro(viewModel: PetHealthCardViewModel): string {
  if (viewModel.snapshot.kind === 'empty') {
    return `We are setting up ${viewModel.pet.name}'s vaccine and deworming plan in Paw-fect. Share this card when you want family to see the plan is on the way.`;
  }

  const overdue = viewModel.snapshot.items.find(item => item.status === 'overdue');
  if (overdue) {
    return `${plainTaskName(overdue.label)} is overdue. Share this card so helpers know what to book next.`;
  }

  const next = viewModel.snapshot.items.find(item => item.status !== 'done');
  if (next) {
    return `${viewModel.pet.name}'s care is tracked in Paw-fect. Share the wins and what is coming up next.`;
  }

  return `${viewModel.pet.name} is up to date. Share the latest care wins with people who love your pet.`;
}

export function shareCardFooterCta(): string {
  return 'Get the Paw-fect app';
}

export function shareCardFooterHint(): string {
  return 'Share this card with family, friends, or your vet.';
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
  if (viewModel.glance.length > 0) {
    return viewModel.glance;
  }

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
