import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Attached to `NavigationContainer`. When authenticated, the tree root is the bottom tab navigator.
 */
export const navigationRef = createNavigationContainerRef();
