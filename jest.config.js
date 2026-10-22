module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    '\\.riv$': '<rootDir>/__mocks__/rivAssetMock.js',
    '^@repo-shared/(.*)$': '<rootDir>/src/shared/$1',
  },
};
