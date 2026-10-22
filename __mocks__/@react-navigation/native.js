// Jest stand-in for @react-navigation/native (the real package ships ESM).
// Tests that need richer behaviour call jest.mock with their own factory.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require('react');

module.exports = {
  NavigationContext: React.createContext(undefined),
  useNavigation: () => ({
    navigate: () => undefined,
    goBack: () => undefined,
    isFocused: () => true,
    addListener: () => () => undefined,
  }),
  useRoute: () => ({ params: undefined }),
  useIsFocused: () => true,
  useFocusEffect: () => undefined,
};
