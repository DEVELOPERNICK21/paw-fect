import { NativeModules, Platform } from 'react-native';

import { clearDeviceGlanceSurfaces } from '../syncDeviceGlanceSurfaces';

describe('clearDeviceGlanceSurfaces', () => {
  const originalOs = Platform.OS;
  const clear = jest.fn();

  beforeEach(() => {
    clear.mockClear();
    (NativeModules as Record<string, unknown>).WidgetDataModule = {
      sync: jest.fn(),
      clear,
    };
  });

  afterEach(() => {
    Platform.OS = originalOs;
    delete (NativeModules as Record<string, unknown>).WidgetDataModule;
  });

  it.each(['ios', 'android'] as const)('asks the %s module to clear', os => {
    Platform.OS = os;
    clearDeviceGlanceSurfaces();
    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the native module is missing or lacks clear()', () => {
    Platform.OS = 'android';
    (NativeModules as Record<string, unknown>).WidgetDataModule = {
      sync: jest.fn(),
    };
    expect(() => clearDeviceGlanceSurfaces()).not.toThrow();
    delete (NativeModules as Record<string, unknown>).WidgetDataModule;
    expect(() => clearDeviceGlanceSurfaces()).not.toThrow();
  });
});
