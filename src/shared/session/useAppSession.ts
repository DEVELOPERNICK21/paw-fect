import { useEffect, useState } from 'react';

import {
  getAppSessionValues,
  subscribeAppSession,
  type AppSessionValues,
} from './appSessionPorts';

/** Reactive session projection for UI. Wired at the app composition root. */
export function useAppSession(): AppSessionValues {
  const [values, setValues] = useState<AppSessionValues>(getAppSessionValues);
  useEffect(() => subscribeAppSession(() => setValues(getAppSessionValues())), []);
  return values;
}
