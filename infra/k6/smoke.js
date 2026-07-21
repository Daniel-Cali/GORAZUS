// GORAZUS ERP — smoke test (k6). 1 VU, pocas iteraciones: confirma que los
// endpoints reales responden correctamente ANTES de someterlos a carga real
// (load.js/stress.js) — mismo principio que un test unitario antes de un
// test de integración. Pensado para correr en CI en cada deploy a staging.
//
// Uso: docker run --rm -i --network host -e BASE_URL=https://localhost \
//        grafana/k6 run --insecure-skip-tls-verify - < infra/k6/smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://localhost';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'demo';
const EMAIL = __ENV.EMAIL || 'admin@demo.local';
const PASSWORD = __ENV.PASSWORD || 'Test1234!';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const live = http.get(`${BASE_URL}/api/v1/health/live`);
  check(live, { 'health/live -> 200': (r) => r.status === 200 });

  const ready = http.get(`${BASE_URL}/api/v1/health/ready`);
  check(ready, { 'health/ready -> 200': (r) => r.status === 200 });

  const login = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ tenantSlug: TENANT_SLUG, email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(login, {
    'auth/login -> 200': (r) => r.status === 200,
    'auth/login devuelve accessToken': (r) => !!JSON.parse(r.body).data?.accessToken,
  });

  const token = login.status === 200 ? JSON.parse(login.body).data.accessToken : null;
  if (token) {
    const roles = http.get(`${BASE_URL}/api/v1/seguridad/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(roles, { 'seguridad/roles -> 200': (r) => r.status === 200 });
  }

  sleep(1);
}
