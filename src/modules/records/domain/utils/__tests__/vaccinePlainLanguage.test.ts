import {
  plainVaccineDisplayName,
  vaccineProtectionHint,
} from '../vaccinePlainLanguage';

describe('vaccinePlainLanguage', () => {
  it('explains DHPP in plain language', () => {
    expect(plainVaccineDisplayName('DHPP (1st)')).toContain('Core dog vaccine');
    expect(vaccineProtectionHint('DHPP')).toMatch(/parvovirus/i);
  });

  it('explains rabies and deworming', () => {
    expect(plainVaccineDisplayName('Rabies')).toMatch(/fatal/i);
    expect(vaccineProtectionHint('Deworming')).toMatch(/worms/i);
  });
});
