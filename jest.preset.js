const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Sin esto, Jest solo cuenta cobertura de archivos realmente importados
  // por algún test — un paquete con un solo archivo probado reporta 100%
  // aunque el resto del paquete no tenga ni un test (confirmado: core/config
  // marcaba 100% con un solo spec hasta agregar esto, cayendo a ~35% real).
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.e2e-spec.ts', '!**/index.ts', '!**/*.config.ts'],
  // Piso de seguridad, no una meta Enterprise — calibrado por debajo del
  // paquete real más bajo medido en esta sesión (core/http, ~7-9%) para que
  // `pnpm test:cov` no rompa hoy. Solo se evalúa cuando se corre con
  // --coverage (test:cov), nunca en `pnpm test`/CI normal — subir este
  // número a medida que cada paquete gane cobertura real es trabajo de
  // sesiones futuras, no de esta fase de infraestructura.
  coverageThreshold: {
    global: {
      statements: 5,
      branches: 5,
      functions: 5,
      lines: 5,
    },
  },
};
