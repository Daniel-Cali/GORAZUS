# GORAZUS ERP — Testing de carga/estrés (k6)

3 scripts contra los endpoints reales que existen hoy (`health`, `auth/login`, `seguridad/roles`)
— no se inventa carga contra módulos de negocio sin backend todavía.

| Script      | Objetivo                                                                           | Umbrales                             |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| `smoke.js`  | 1 VU, 5 iteraciones — confirma que los endpoints responden bien antes de cargarlos | Gate de CI (falla el run si no pasa) |
| `load.js`   | Carga sostenida realista (rampa a 20 VUs, 2 min)                                   | Gate de CI                           |
| `stress.js` | Rampa hasta 200 VUs — encuentra el punto de quiebre                                | Exploratorio, sin gate               |

## Uso

```bash
docker run --rm -i --network <red-del-compose> -e BASE_URL=https://nginx \
  grafana/k6 run --insecure-skip-tls-verify - < smoke.js
```

## Resultado real (2026-07-20, contra el stack local completo)

- **`smoke.js`**: 100% de checks pasan, p95 = 193ms. Sin hallazgos.
- **`load.js`**: **86% de fallos a 20 VUs — hallazgo real, no un bug.** Confirmado con `curl`
  directo: el rate limiter global (`core/http/http.module.ts`, `ThrottlerModule` — 100
  requests/60s **por IP**) devuelve `429` apenas el tráfico sostenido de un solo cliente supera ese
  umbral. Es el comportamiento correcto y deseado (protección anti-abuso) — el hallazgo real de
  capacidad es que **el límite es global por IP, no por usuario autenticado ni diferenciado por
  endpoint** (`core/http/http.module.ts` línea ~20: "valor por defecto, sin ajuste por
  módulo/endpoint todavía"). En producción, cualquier grupo de usuarios detrás de un NAT/proxy
  compartido (oficina, VPN corporativa) alcanzaría este mismo límite legítimamente. **No corregido
  acá** — cambiar la política de rate limiting es una decisión de producto/seguridad, no algo que
  se ajusta unilateralmente al correr un test de carga. Documentado para que se revise antes de un
  primer despliegue real con usuarios concurrentes esperados.
- **`stress.js`**: hasta 200 VUs / ~134 req/s sostenidos por 2.5 minutos — **el servidor no se cayó
  en ningún momento** (0 errores de conexión, todas las respuestas fueron HTTP válidas, la mayoría
  `429` por el mismo rate limiter). De las que sí pasaron el límite, la latencia P95 subió a 2.83s
  (vs. 193ms en `smoke.js`) — esperable, `argon2id` en `auth/login` es deliberadamente costoso en
  CPU y la imagen corre en un solo proceso Node (`ts-node`, sin cluster/PM2) — con más réplicas
  reales (ver `infra/kubernetes/base/api-hpa.yaml`) esto se distribuye.
