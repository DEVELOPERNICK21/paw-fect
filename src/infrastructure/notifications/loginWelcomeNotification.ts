import { notificationService } from './notificationService';

export async function showLoginWelcomeNotification(input: {
  displayName: string | null;
}): Promise<void> {
  const name = input.displayName?.trim() || 'there';

  await notificationService.displayImmediateNotification({
    id: 'session-welcome',
    title: `Welcome back, ${name}`,
    body: 'Open Pawfect to check on your pets and today’s care.',
    data: { kind: 'loginWelcome' },
  });
}
