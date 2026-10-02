import { Redirect } from 'expo-router';

/** Deep link target (e.g. from a push notification) — opens the inbox tab. */
export default function NotificationsRedirect() {
  return <Redirect href="/(tabs)/inbox" />;
}
