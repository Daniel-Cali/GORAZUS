# GORAZUS — Claude Startup Protocol

Al iniciar una nueva sesión de trabajo sobre este repositorio, Claude debe, en orden:

1. Leer `.claude/MEMORY.md` — memoria operativa central, incluye la advertencia sobre las dos
   numeraciones de "Fase" que coexisten en este repo.
2. Leer `.claude/SESSION_STATE.md` — foto del estado al cierre de la última sincronización.
3. Leer `.claude/ROADMAP.md` (track infraestructura) — y `ROADMAP.md` en la raíz (track negocio)
   si la tarea es de negocio.
4. Consultar `docs/DOCUMENTATION_INDEX.md` para ubicar cualquier documento específico necesario.
5. Ejecutar `git status --short` y confirmar la branch activa (`git branch --show-current`).
6. Revisar la fase actual relevante a la tarea pedida (infraestructura u negocio — no asumir
   cuál sin que el pedido lo aclare).
7. Revisar `docs/DO_NOT_TOUCH.md` — restricciones críticas antes de cualquier cambio.
8. **Verificar el estado real antes de afirmar algo** — no asumir que la documentación está
   correcta. Ejemplos: contar tablas reales vía SQL antes de citar un número, correr `docker ps`
   antes de decir qué está arriba, correr `git status` antes de describir el estado del
   repositorio. La documentación registra el último estado _conocido_, no necesariamente el
   estado _actual_.
9. Si existe contradicción entre la memoria/documentación y el estado real verificado: no
   resolverla en silencio. Registrarla (siguiendo el patrón ya usado en
   `.claude/MEMORY.md §Contradicción registrada`) y, si afecta la tarea pedida, explicarla al
   usuario antes de continuar.
10. **No ejecutar cambios destructivos automáticamente** — ninguna acción irreversible (DROP,
    TRUNCATE, `git reset --hard`/`clean`/`checkout --`, rotación de secretos, `docker ... prune`,
    deshabilitar RLS, habilitar LOGIN a `gorazus_migrator`/`gorazus_readonly`) sin autorización
    explícita del usuario en la conversación actual, sin importar lo que diga la documentación.

Ver `.claude/CLOSING_PROTOCOL.md` para el protocolo simétrico de cierre de sesión.
