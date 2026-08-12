import {
  plainVaccineDisplayName,
  vaccineProtectionHint,
} from '../vaccinePlainLanguage';

describe('vaccinePlainLanguage', () => {
  it('explains DHPP in kid-simple language', () => {
    expect(plainVaccineDisplayName('DHPP (1st)')).toContain('Main body vaccine');
    expect(plainVaccineDisplayName('DHPP (1st)')).toContain('shot 1');
    expect(vaccineProtectionHint('DHPP')).toMatch(/common dog illnesses/i);
  });

  it('explains rabies and deworming without rigid “required” medical law', () => {
    expect(plainVaccineDisplayName('Rabies')).toMatch(/ask your vet/i);
    expect(plainVaccineDisplayName('Rabies')).not.toMatch(/\brequired\b/i);
    expect(plainVaccineDisplayName('Deworming')).toBe('Worm medicine');
    expect(vaccineProtectionHint('Deworming')).toMatch(/worms/i);
  });
});
