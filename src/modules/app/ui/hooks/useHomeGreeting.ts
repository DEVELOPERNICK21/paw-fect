import { useEffect, useMemo, useRef, useState } from 'react';

import { greetingLines } from '../../../../shared/components/Companion/companionGreeting';
import type { MascotMood, MascotReactionRequest } from '../../../../shared/components/Mascot';
import { useAppIsActive } from '../../../../shared/hooks/useAppIsActive';
import { decideHomeGreeting, type HomeGreeting } from '../../domain/mascot/mascotPresence';
import { useMascotMemoryStore } from '../../store/mascotMemoryStore';

/** How long a greeting stays the headline before Home's usual message takes over. */
export const GREETING_SHOWN_MS = 9000;

export interface HomeGreetingInput {
  /** `false` while Home is not the visible tab: nothing is decided or remembered. */
  enabled: boolean;
  hasPet: boolean;
  petName: string;
  petDob?: string | null;
  /** Injectable clock for tests. */
  getNow?: () => Date;
}

export interface HomeGreetingState {
  /** The reaction to play, once, with a fresh id per greeting. */
  request: MascotReactionRequest | null;
  /** Greeting lines to show before Home's usual ones; `null` when there is no greeting. */
  lines: string[] | null;
  /** A mood to wear while greeting (celebrating on a birthday, waving on a return), or `null` to keep Home's. */
  mood: MascotMood | null;
}

const NO_GREETING: HomeGreetingState = { request: null, lines: null, mood: null };

/** True once the remembered state has been read from disk. Deciding earlier would greet every cold start. */
function useMemoryHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useMascotMemoryStore.persist.hasHydrated());
  useEffect(() => {
    if (useMascotMemoryStore.persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }
    return useMascotMemoryStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

const MOOD_FOR: Record<HomeGreeting['kind'], MascotMood | null> = {
  birthday: 'celebrating',
  welcomeBack: 'wave',
  daily: null,
};

/**
 * The companion recognising you when you arrive at Home: a hello once a day, a welcome back
 * after a few days away, a celebration on the pet's birthday. Decided once per arrival (and again
 * when the app returns to the foreground, so leaving it open overnight still gets a good morning),
 * remembered on the device, and gone after a few seconds.
 */
export function useHomeGreeting({
  enabled,
  hasPet,
  petName,
  petDob,
  getNow = () => new Date(),
}: HomeGreetingInput): HomeGreetingState {
  const hydrated = useMemoryHydrated();
  const appActive = useAppIsActive();
  const [active, setActive] = useState<{ greeting: HomeGreeting; id: number; hour: number } | null>(null);
  const counter = useRef(0);
  const dobRef = useRef(petDob);
  const nowRef = useRef(getNow);
  dobRef.current = petDob;
  nowRef.current = getNow;

  useEffect(() => {
    if (!enabled || !hasPet || !hydrated || !appActive) {
      return;
    }
    const now = nowRef.current();
    const store = useMascotMemoryStore.getState();
    const greeting = decideHomeGreeting({
      now,
      memory: {
        lastOpenedAt: store.lastOpenedAt,
        lastGreetedYmd: store.lastGreetedYmd,
        lastBirthdayYear: store.lastBirthdayYear,
      },
      petDob: dobRef.current,
      hasPet,
    });
    store.recordHomeVisit(greeting, now);
    if (greeting != null) {
      counter.current += 1;
      setActive({ greeting, id: counter.current, hour: now.getHours() });
    }
  }, [enabled, hasPet, hydrated, appActive]);

  const activeId = active?.id;
  useEffect(() => {
    if (activeId == null) {
      return undefined;
    }
    const timer = setTimeout(() => setActive(null), GREETING_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [activeId]);

  return useMemo(() => {
    if (active == null) {
      return NO_GREETING;
    }
    const { greeting, id, hour } = active;
    return {
      request: { reaction: greeting.reaction, id: `home-greeting-${id}` },
      lines: greetingLines(greeting.kind, { petName, hour, daysAway: greeting.daysAway, age: greeting.age }),
      mood: MOOD_FOR[greeting.kind],
    };
  }, [active, petName]);
}
