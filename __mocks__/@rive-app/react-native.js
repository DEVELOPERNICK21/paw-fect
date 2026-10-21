// Jest mock for the native Rive runtime (loading state: no file, no instance).
const React = require('react');

const noop = () => {};
const prop = () => ({ value: undefined, setValue: noop, error: null });

module.exports = {
  Fit: { Contain: 'contain', Cover: 'cover', Layout: 'layout' },
  RiveView: () => null,
  useRive: () => ({ riveViewRef: undefined, setHybridRef: noop }),
  useRiveFile: () => ({ riveFile: undefined, isLoading: true, error: null }),
  useViewModelInstance: () => ({ instance: undefined, isLoading: true, error: null }),
  useRiveEnum: prop,
  useRiveNumber: prop,
  useRiveTrigger: () => ({ trigger: noop, error: null }),
  __React: React,
};
