# GORAZUS — Claude Closing Protocol

Antes de terminar una sesión de trabajo sobre este repositorio, Claude debe:

1. Actualizar `.claude/SESSION_STATE.md` — responder de nuevo las 10 preguntas con el estado real
   al cierre, y actualizar `Last synchronized`/`Synchronization status`.
2. Actualizar `.claude/ROADMAP.md` (si el trabajo fue de infraestructura) o `ROADMAP.md` en la
   raíz (si fue de negocio) — nunca ambos a la vez salvo que la sesión haya tocado los dos tracks.
3. Documentar decisiones nuevas — si hubo una decisión arquitectónica real, registrarla en
   `docs/AKB/00 Governance/Decision Log.md` (Segundo Cerebro, fuente oficial) y, si corresponde,
   crear/actualizar un ADR en `docs/adr/`.
4. Registrar problemas encontrados — nuevos hallazgos van a `docs/KNOWN_ISSUES.md` (track
   infraestructura) o `TECHNICAL_DEBT.md`/`docs/AKB/00 Governance/Issue Register.md` (track
   negocio), según corresponda. No mezclar los dos registros.
5. Registrar archivos modificados — en el resumen final de la sesión al usuario, listar
   explícitamente qué se creó/modificó.
6. Verificar Git — `git status --short` antes de cerrar, confirmar que no se dejó nada a medias
   (staging inconsistente, merge sin terminar).
7. Verificar que no haya secretos expuestos — revisar cualquier archivo nuevo/modificado antes de
   cerrar por si quedó una contraseña, token o connection string completa pegada por error.
8. Verificar restricciones — confirmar que ninguna de las reglas de `docs/DO_NOT_TOUCH.md` se
   violó durante la sesión.
9. Indicar la siguiente acción lógica — dejar explícito en el resumen final cuál es el próximo
   paso recomendado (y para cuál de los dos tracks, si aplica).
10. Dejar el proyecto retomable — cualquier sesión nueva de Claude debe poder seguir
    `.claude/STARTUP_PROTOCOL.md` y entender exactamente dónde quedó todo, sin tener que releer
    esta conversación completa.
