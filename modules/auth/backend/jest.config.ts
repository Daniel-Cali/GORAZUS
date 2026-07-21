export default {
  displayName: 'auth-backend',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Preset por defecto de Nx solo matchea `*.spec.ts` — se agrega
  // `*.e2e-spec.ts` para los tests de integración reales (FASE 02 Backend
  // Enterprise), sin perder los unitarios (`testMatch` reemplaza, no
  // extiende, el del preset).
  testMatch: ['**/?(*.)+(spec|e2e-spec|test).[jt]s?(x)'],
  coverageDirectory: '../../../coverage/modules/auth/backend',
};
