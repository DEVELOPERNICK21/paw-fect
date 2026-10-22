import type { CareCompletionEvent } from '../../domain/models/CareCompletionEvent';
import { CareCompletionEventHub } from '../CareCompletionEventHub';

const event: CareCompletionEvent = {
  type: 'care-task-completed',
  petId: 'p1',
  blockId: 'b1',
  date: '2026-10-22',
  dayCompleted: false,
};

describe('CareCompletionEventHub', () => {
  it('delivers events to every subscriber', () => {
    const hub = new CareCompletionEventHub();
    const a = jest.fn();
    const b = jest.fn();
    hub.subscribe(a);
    hub.subscribe(b);
    hub.emit(event);
    expect(a).toHaveBeenCalledWith(event);
    expect(b).toHaveBeenCalledWith(event);
  });

  it('stops delivering after unsubscribe', () => {
    const hub = new CareCompletionEventHub();
    const a = jest.fn();
    const off = hub.subscribe(a);
    off();
    hub.emit(event);
    expect(a).not.toHaveBeenCalled();
  });

  it('a throwing listener does not stop the others or the emitter', () => {
    const hub = new CareCompletionEventHub();
    const after = jest.fn();
    hub.subscribe(() => {
      throw new Error('boom');
    });
    hub.subscribe(after);
    expect(() => hub.emit(event)).not.toThrow();
    expect(after).toHaveBeenCalledTimes(1);
  });

  it('a listener that unsubscribes while being called is safe', () => {
    const hub = new CareCompletionEventHub();
    const second = jest.fn();
    const off = hub.subscribe(() => off());
    hub.subscribe(second);
    hub.emit(event);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
