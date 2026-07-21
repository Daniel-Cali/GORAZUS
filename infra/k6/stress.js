// GORAZUS ERP — test de estrés (k6). Sube mucho más allá de la carga
// normal (load.js) para encontrar el punto de quiebre real — a diferencia
// de load.js, acá SÍ se espera degradación/errores en algún punto; el
// objetivo es medir DÓNDE ocurre, no asumir que nunca debería pasar. Sin
// umbrales duros que fallen el run (es exploratorio, no un gate de CI).
//
// Uso: docker run --rm -i --network host -e BASE_URL=https://localhost \
//        grafana/k6 run --insecure-skip-tls-verify - < infra/k6/stress.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://localhost';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'demo';
const EMAIL = __ENV.EMAIL || 'admin@demo.local';
const PASSWORD = __ENV.PASSWORD || 'Test1234!';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const login = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ tenantSlug: TENANT_SLUG, email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } },
  );
  check(login, { 'auth/login responde (cualquier status)': (r) => r.status !== 0 });
  sleep(0.5);
}
