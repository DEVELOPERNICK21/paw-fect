import type { PetCreatedEvent } from '../../domain/models/PetCreatedEvent';
import { PetCreatedEventHub } from '../PetCreatedEventHub';

const event: PetCreatedEvent = { type: 'pet-created', petId: 'p1', petName: 'Bruno', petType: 'dog' };

describe('PetCreatedEventHub', () => {
  it('delivers to every subscriber and stops after unsubscribe', () => {
    const hub = new PetCreatedEventHub();
    const a = jest.fn();
    const b = jest.fn();
    const off = hub.subscribe(a);
    hub.subscribe(b);
    hub.emit(event);
    off();
    hub.emit(event);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('a throwing listener does not stop the others or the emitter', () => {
    const hub = new PetCreatedEventHub();
    const after = jest.fn();
    hub.subscribe(() => {
      throw new Error('boom');
    });
    hub.subscribe(after);
    expect(() => hub.emit(event)).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
  });
});
