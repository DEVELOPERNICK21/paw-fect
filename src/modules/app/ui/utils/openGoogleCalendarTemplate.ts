import { Alert, Linking } from 'react-native';

import { addDaysToYmd } from '../../domain/utils/homeDashboardDates';

/**
 * Opens Google Calendar “create event” with an all-day entry on the given local date.
 * Works on phones with a browser / Google Calendar app handling the link.
 */
export async function openGoogleCalendarAllDayEvent(params: {
  title: string;
  dateYmd: string;
  details?: string;
}): Promise<void> {
  const start = params.dateYmd.slice(0, 10).replace(/-/g, '');
  const end = addDaysToYmd(params.dateYmd.slice(0, 10), 1).replace(/-/g, '');
  const base = 'https://www.google.com/calendar/render';
  let url = `${base}?action=TEMPLATE&text=${encodeURIComponent(params.title)}&dates=${start}/${end}`;
  if (params.details != null && params.details.length > 0) {
    url += `&details=${encodeURIComponent(params.details)}`;
  }
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // fall through
  }
  Alert.alert(
    'Calendar',
    'Unable to open the calendar app. You can add this date manually in your calendar.',
  );
}
