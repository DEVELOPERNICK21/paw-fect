import { MASCOT_MOODS, MASCOT_REACTIONS } from '../mascotTypes';
import { RIVE_PROPS } from '../mascotRiveSource';

// The project's tsconfig loads only the `jest` types, so Node's `fs` / `path` are typed by hand here
// instead of imported (importing them would not type-check in a clean checkout).
interface FsLike {
  readFileSync: (file: string, encoding: 'latin1') => string;
}
interface PathLike {
  join: (...parts: string[]) => string;
}
declare const __dirname: string;
const fs = jest.requireActual<FsLike>('fs');
const path = jest.requireActual<PathLike>('path');

/**
 * The mocked Rive runtime used by the other tests cannot tell whether a `.riv` really exposes
 * the names the app writes to, so this reads the shipped file. Rive stores names and enum
 * keys as plain UTF-8 (here read as latin1: one character per byte, and the names are ASCII),
 * so a missing or renamed one is easy to catch here.
 * It does not prove the animation plays (that needs the runtime; see the docs).
 */
const dir = path.join(__dirname, '../../../assets/rive');
const FILES = ['pawfect-companion.riv'];
const MAX_BYTES = 400 * 1024;

describe.each(FILES)('%s', file => {
  const content = fs.readFileSync(path.join(dir, file), 'latin1');
  const has = (text: string): boolean => content.includes(text);

  it('is a Rive file and small enough to ship', () => {
    expect(content.slice(0, 4)).toBe('RIVE');
    expect(content.length).toBeGreaterThan(1000);
    expect(content.length).toBeLessThan(MAX_BYTES);
  });

  it('has the artboard, state machine and view model the app expects', () => {
    expect(has('Mascot')).toBe(true);
    expect(has('Main')).toBe(true);
  });

  it.each(Object.values(RIVE_PROPS))('exposes the view-model property "%s"', name => {
    expect(has(name)).toBe(true);
  });

  it.each(MASCOT_MOODS)('has the mood enum value "%s"', mood => {
    expect(has(mood)).toBe(true);
  });

  it('has one trigger per reaction', () => {
    for (const reaction of MASCOT_REACTIONS) {
      expect(has(reaction)).toBe(true);
    }
  });
});
