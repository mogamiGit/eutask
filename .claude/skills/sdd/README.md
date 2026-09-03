# sdd — skill del flujo Spec-Driven Development

Conduce el proyecto por las ocho fases del flujo SDD —Constitución, Spec,
Clarificación, Plan, Tareas, Implementación, Validación y Próximos pasos—, una a una:
detecta en qué fase estás, pregunta antes de avanzar y sabe qué fichero toca
escribir en cada una.

## Contenido

```
sdd/
├── SKILL.md                 # el orquestador; única fuente de verdad
├── scripts/sdd-status.sh    # detector de fase
├── references/              # detalle de cada fase, se lee bajo demanda
│   ├── 1-constitution.md … 8-next-steps.md
│   └── ears.md              # los cinco patrones EARS en español
└── assets/                  # plantillas de salida
    ├── constitution-template.md
    ├── agents-template.md
    ├── spec-template.md
    ├── plan-template.md
    └── tasks-template.md
```

`SKILL.md` solo carga en contexto la tabla de fases y las reglas transversales.
El detalle de una fase se lee únicamente al entrar en ella.

## Uso

Se activa sola al hablar de specs, planes, tareas o de «por dónde iba», o a mano
con `/sdd`. Lo primero que hace es ejecutar el detector:

```bash
bash .claude/skills/sdd/scripts/sdd-status.sh eutask-cli
```

```
Proyecto: eutask-cli
Constitucion: OK docs/constitution.md
Contexto del agente: OK AGENTS.md

Specs:
  001-habits-mvp           spec OK  plan OK  tasks OK (17/17)
  002-habits-frequency     spec OK  plan FALTA  tasks FALTA

Spec activa: 002-habits-frequency
Siguiente fase: 3. Clarificacion o 4. Plan
```

El script funciona por sí solo: pásale el directorio del proyecto (por defecto,
el actual). Sale `0` siempre, salvo `2` si el directorio no existe.

## Instalación en otros sitios

La carpeta es autocontenida. Solo cambia dónde se coloca.

```bash
# Todos tus proyectos (Claude Code)
cp -R .claude/skills/sdd ~/.claude/skills/

# opencode, en el proyecto
mkdir -p .opencode/skill && cp -R .claude/skills/sdd .opencode/skill/

# opencode, global
cp -R .claude/skills/sdd ~/.config/opencode/skill/
```

Si tu sistema maneja symlinks, enlaza en vez de copiar: así no hay nada que
sincronizar.

## Relación con `spec-generator`

`habits-cli/.claude/skills/spec-generator/` cubre solo la fase 2 y se mantiene
como material del curso. `sdd` la reemplaza funcionalmente: no uses las dos a la
vez sobre el mismo proyecto.

## Mantenimiento

`SKILL.md` manda. Si crece por encima de ~120 líneas, mueve el detalle a
`references/`: lo que está en `SKILL.md` se paga en contexto en cada sesión, lo
que está en `references/` solo cuando hace falta.
