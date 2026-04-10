import { notificationService } from './notificationService';

export async function showLoginWelcomeNotification(input: {
  displayName: string | null;
  email: string;
}): Promise<void> {
  const fromEmail = input.email.split('@')[0]?.trim() ?? '';
  const name =
    input.displayName?.trim() ||
    (fromEmail.length > 0 ? fromEmail : 'there');

  await notificationService.displayImmediateNotification({
    id: 'session-welcome',
    title: `Welcome back, ${name}`,
    body: 'Open Pawfect to check on your pets and today’s care.',
    data: { kind: 'loginWelcome' },
  });
}
