export default {
  displayName: 'productos-backend',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['**/?(*.)+(spec|e2e-spec|test).[jt]s?(x)'],
  coverageDirectory: '../../../coverage/modules/productos/backend',
};
