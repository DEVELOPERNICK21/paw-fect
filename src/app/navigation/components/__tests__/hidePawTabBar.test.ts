import {
  resolvePetsNestedRoute,
  shouldHidePawTabBar,
} from '../hidePawTabBar';

describe('shouldHidePawTabBar', () => {
  it('hides the bar on Edit Pet (AddPet with petId)', () => {
    expect(
      shouldHidePawTabBar({ name: 'AddPet', params: { petId: 'pet-1' } }),
    ).toBe(true);
  });

  it('keeps the bar on Add Pet and other screens', () => {
    expect(shouldHidePawTabBar({ name: 'AddPet' })).toBe(false);
    expect(shouldHidePawTabBar({ name: 'AddPet', params: { petId: '' } })).toBe(
      false,
    );
    expect(shouldHidePawTabBar({ name: 'PetProfile' })).toBe(false);
    expect(shouldHidePawTabBar(undefined)).toBe(false);
  });
});

describe('resolvePetsNestedRoute', () => {
  it('reads the focused stack route', () => {
    expect(
      resolvePetsNestedRoute({
        name: 'PetsTab',
        state: {
          index: 1,
          routes: [
            { name: 'PetProfile' },
            { name: 'AddPet', params: { petId: 'pet-1' } },
          ],
        },
      }),
    ).toEqual({ name: 'AddPet', params: { petId: 'pet-1' } });
  });

  it('reads the initial navigate payload before the stack hydrates', () => {
    expect(
      resolvePetsNestedRoute({
        name: 'PetsTab',
        params: { screen: 'AddPet', params: { petId: 'pet-1' } },
      }),
    ).toEqual({ name: 'AddPet', params: { petId: 'pet-1' } });
  });
});
