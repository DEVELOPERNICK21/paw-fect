import type { ImageSourcePropType } from 'react-native';

export type PetHealthCardItemStatus = 'done' | 'due_in' | 'overdue';

export interface PetHealthCardItem {
  label: string;
  status: PetHealthCardItemStatus;
  detail: string;
}

export type PetHealthCardSnapshot =
  | { kind: 'items'; items: PetHealthCardItem[] }
  | { kind: 'empty'; speciesEmoji: string };

export interface PetHealthCardViewModel {
  pet: {
    name: string;
    breedLabel: string | null;
    ageLabel: string | null;
    photoSource: ImageSourcePropType;
  };
  snapshot: PetHealthCardSnapshot;
  footer: {
    /** Visible URL printed on the card footer (kept short, no token). */
    urlLabel: string;
    /** "🐾 Paw-fect" brand label on the card footer. */
    brandLabel: string;
    /**
     * Full URL appended to the share-sheet caption.
     * v1: same install URL for everyone. v1.1: per-pet deep-link token.
     */
    shareUrl: string;
  };
}
