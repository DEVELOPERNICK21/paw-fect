import type { Pet } from '../../models/Pet';
import type { PetHealthMilestones } from '../../ports/PetHealthCoordinationPort';
import {
  createPetFormSnapshot,
  petFormPhotoKey,
  petFormSnapshotsEqual,
  snapshotFromPetAndMilestones,
} from '../petFormSnapshot';

const emptySnapshot = createPetFormSnapshot({
  name: 'Tiger',
  petType: 'dog',
  breed: '',
  dob: '2020-01-01',
  gender: '',
  lifestyleType: 'indoor',
  lifestyleRiskLevel: 'low',
  region: 'IN',
  photoKey: 'none',
  hasPreviousDeworming: false,
  lastDewormingDate: '',
  lastDewormingUnknown: false,
  hasPreviousVaccination: false,
  lastVaccinationDate: '',
  lastVaccinationUnknown: false,
  hasPreviousRabies: false,
  lastRabiesDate: '',
  lastRabiesUnknown: false,
});

describe('petFormSnapshotsEqual', () => {
  it('treats trimmed whitespace as the same value', () => {
    const spaced = createPetFormSnapshot({
      ...emptySnapshot,
      name: '  Tiger  ',
      breed: '  Lab  ',
    });
    const tight = createPetFormSnapshot({
      ...emptySnapshot,
      name: 'Tiger',
      breed: 'Lab',
    });
    expect(petFormSnapshotsEqual(spaced, tight)).toBe(true);
  });

  it('detects a field change', () => {
    const next = createPetFormSnapshot({
      ...emptySnapshot,
      name: 'Luna',
    });
    expect(petFormSnapshotsEqual(emptySnapshot, next)).toBe(false);
  });
});

describe('petFormPhotoKey', () => {
  it('prefers a pending pick over the existing uri', () => {
    expect(
      petFormPhotoKey({
        pendingLocalUri: 'file://new.jpg',
        photoCleared: false,
        photoUri: 'file://old.jpg',
      }),
    ).toBe('pending:file://new.jpg');
  });

  it('marks a cleared photo as changed from an existing uri', () => {
    expect(
      petFormPhotoKey({
        pendingLocalUri: null,
        photoCleared: true,
        photoUri: '',
      }),
    ).toBe('cleared');
  });
});

describe('snapshotFromPetAndMilestones', () => {
  it('builds a baseline from a loaded pet and health dates', () => {
    const pet: Pet = {
      id: 'p1',
      userId: 'u1',
      name: 'Tiger',
      type: 'dog',
      breed: 'Lab',
      gender: 'male',
      dob: '2020-01-01',
      lifestyle: { type: 'indoor', riskLevel: 'low' },
      region: 'IN',
      photo: 'data:image/jpeg;base64,abc',
      createdAt: '2020-01-01',
      updatedAt: '2020-01-01',
    };
    const milestones: PetHealthMilestones = {
      lastDewormingDate: '2024-06-01',
    };
    const snap = snapshotFromPetAndMilestones(pet, milestones);
    expect(snap.name).toBe('Tiger');
    expect(snap.hasPreviousDeworming).toBe(true);
    expect(snap.lastDewormingDate).toBe('2024-06-01');
    expect(snap.photoKey).toBe('uri:data:image/jpeg;base64,abc');
  });
});
