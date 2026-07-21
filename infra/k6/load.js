// GORAZUS ERP — test de carga (k6). Simula tráfico sostenido realista contra
// los endpoints reales que existen hoy (health + login — el resto de
// módulos de negocio todavía no tiene backend, no se inventa carga contra
// endpoints que no existen). `auth/login` es el objetivo más representativo:
// hashea con argon2id (deliberadamente costoso, ver
// packages/tooling/utils/hash.ts) + una query real con RLS forzado — es el
// endpoint con más probabilidad real de ser el cuello de botella.
//
// Uso: docker run --rm -i --network host -e BASE_URL=https://localhost \
//        grafana/k6 run --insecure-skip-tls-verify - < infra/k6/load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://localhost';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'demo';
const EMAIL = __ENV.EMAIL || 'admin@demo.local';
const PASSWORD = __ENV.PASSWORD || 'Test1234!';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // ramp-up
    { duration: '2m', target: 20 }, // carga sostenida
    { duration: '30s', target: 0 }, // ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% de error
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    'http_req_duration{endpoint:login}': ['p(95)<2500'], // argon2id es costoso a propósito, umbral más laxo
  },
};

export default function () {
  const live = http.get(`${BASE_URL}/api/v1/health/live`, { tags: { endpoint: 'health' } });
  check(live, { 'health/live -> 200': (r) => r.status === 200 });

  const login = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ tenantSlug: TENANT_SLUG, email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } },
  );
  check(login, { 'auth/login -> 200': (r) => r.status === 200 });

  sleep(1);
}
