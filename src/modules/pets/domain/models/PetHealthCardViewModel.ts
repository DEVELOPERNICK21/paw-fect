export type PetHealthCardItemStatus = 'done' | 'due_in' | 'overdue';

export interface PetHealthCardItem {
  label: string;
  status: PetHealthCardItemStatus;
  detail: string;
}

export type PetHealthCardSnapshot =
  | { kind: 'items'; items: PetHealthCardItem[] }
  | { kind: 'empty'; speciesEmoji: string };

export interface PetHealthCardHighlight {
  emoji: string;
  title: string;
  detail: string;
}

/** UI-agnostic image source: remote URI or bundled asset id. */
export type PetHealthCardPhotoSource = { uri: string } | number;

export interface PetHealthCardViewModel {
  pet: {
    name: string;
    breedLabel: string | null;
    ageLabel: string | null;
    photoSource: PetHealthCardPhotoSource;
    speciesEmoji: string;
    speciesLabel: string;
    genderLabel: string | null;
  };
  snapshot: PetHealthCardSnapshot;
  /** Short share-worthy moments pet parents like to post. */
  highlights: PetHealthCardHighlight[];
  /** Hero stat chips derived from highlights. */
  glance: Array<{ label: string; value: string }>;
  footer: {
    /** Visible URL printed on the card footer (kept short, no token). */
    urlLabel: string;
    /** "🐾 Pawsoul" brand label on the card footer. */
    brandLabel: string;
    /**
     * Full URL appended to the share-sheet caption.
     * v1: same install URL for everyone. v1.1: per-pet deep-link token.
     */
    shareUrl: string;
  };
}
