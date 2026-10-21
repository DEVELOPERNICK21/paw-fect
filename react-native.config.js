// Google ML Kit (pet-photo analysis) ships no Apple-Silicon *simulator* slice, so
// CocoaPods adds EXCLUDED_ARCHS=arm64 for simulators and Xcode then lists no
// simulators at all. For simulator work, install pods with ML Kit left out:
//   yarn pods:simulator   (photo analysis falls back to "couldn't analyze")
// Before any device, TestFlight or App Store build, restore it with:
//   yarn pods:device
const excludeMlKitFromIos = process.env.PAWFECT_IOS_SIMULATOR === '1';

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/shared/assets/fonts/'],
  dependencies: excludeMlKitFromIos
    ? { '@react-native-ml-kit/image-labeling': { platforms: { ios: null } } }
    : {},
};
