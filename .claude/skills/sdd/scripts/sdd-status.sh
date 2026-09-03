#!/usr/bin/env bash
# sdd-status.sh — estado del flujo Spec-Driven Development de un proyecto.
# Uso: sdd-status.sh [directorio-del-proyecto] [spec]
#   directorio-del-proyecto: por defecto, el actual.
#   spec: cual seguir cuando hay varias abiertas (p. ej. 002-habits-frequency).
set -uo pipefail

root="${1:-.}"
want_spec="${2:-}"

if [ ! -d "$root" ]; then
  echo "No existe el directorio: $root" >&2
  exit 2
fi

count_matches() {
  # $1 = patrón fijo, $2 = fichero. Devuelve 0 si no hay coincidencias.
  # -e es obligatorio: los patrones empiezan por "-" y si no se toman por opciones.
  local n
  n="$(grep -cF -e "$1" -- "$2" 2>/dev/null)" || n=0
  [ -n "$n" ] || n=0
  printf '%s' "$n"
}

echo "Proyecto: $(basename "$(cd "$root" && pwd)")"

# --- Constitución y contexto del agente -------------------------------------
constitution="no"
if [ -f "$root/docs/constitution.md" ]; then
  constitution="si"
  echo "Constitucion: OK docs/constitution.md"
else
  echo "Constitucion: FALTA docs/constitution.md"
fi

agents=""
[ -f "$root/AGENTS.md" ] && agents="AGENTS.md"
[ -f "$root/CLAUDE.md" ] && agents="${agents:+$agents }CLAUDE.md"
if [ -n "$agents" ]; then
  echo "Contexto del agente: OK $agents"
else
  echo "Contexto del agente: FALTA AGENTS.md / CLAUDE.md"
fi

# --- Modo SDD ----------------------------------------------------------------
# No se pregunta: se deduce. Los dos modos exigen constitucion y AGENTS.md (la
# fase 1 no es opcional); lo que los separa es si la constitucion compromete la
# spec con el codigo o solo la usa para arrancar.
if [ "$constitution" = "no" ]; then
  echo "Modo: sin determinar (falta la fase 1: no hay constitucion)"
elif [ "$(count_matches 'spec' "$root/docs/constitution.md")" -gt 0 ]; then
  echo "Modo: spec-anchored (la constitucion compromete spec y codigo)"
else
  echo "Modo: spec-first (la constitucion no compromete la spec con el codigo)"
fi

# --- Specs -------------------------------------------------------------------
echo
if [ ! -d "$root/specs" ]; then
  echo "Specs: no hay carpeta specs/"
  echo
  if [ "$constitution" = "no" ]; then
    echo "Spec activa: ninguna"
    echo "Siguiente fase: 1. Constitucion"
  else
    echo "Spec activa: ninguna"
    echo "Siguiente fase: 2. Spec"
  fi
  exit 0
fi

echo "Specs:"

active_dir=""
active_phase=""
found_any="no"
open_names=()
open_phases=()
running=0

for dir in "$root"/specs/*/; do
  [ -d "$dir" ] || continue
  found_any="si"
  name="$(basename "$dir")"

  spec_mark="FALTA"; plan_mark="FALTA"; tasks_mark="FALTA"
  detail=""
  phase=""

  if [ -f "$dir/spec.md" ]; then
    spec_mark="OK"
    pending="$(count_matches '[NECESITA ACLARACIÓN' "$dir/spec.md")"
    if [ "$pending" -gt 0 ]; then
      detail=" ${pending} [NECESITA ACLARACION] sin resolver;"
      phase="3. Clarificacion"
    fi
  else
    phase="2. Spec"
  fi

  [ -f "$dir/plan.md" ] && plan_mark="OK"

  if [ -f "$dir/tasks.md" ]; then
    tasks_mark="OK"
    done_n="$(count_matches '- [x]' "$dir/tasks.md")"
    open_n="$(count_matches '- [ ]' "$dir/tasks.md")"
    total=$((done_n + open_n))
    if [ "$total" -gt 0 ]; then
      tasks_mark="OK (${done_n}/${total})"
    fi
    if [ "$open_n" -gt 0 ]; then
      next_task="$(grep -m1 -F -e '- [ ]' -- "$dir/tasks.md" | sed -E 's/^[[:space:]]*- \[ \][[:space:]]*//; s/\..*$//')"
      detail="${detail} siguiente tarea: ${next_task}"
      [ -z "$phase" ] && phase="6. Implementacion"
    elif [ "$total" -gt 0 ]; then
      [ -z "$phase" ] && phase="7. Validacion (todas las tareas cerradas)"
    fi
  fi

  if [ -z "$phase" ]; then
    if [ ! -f "$dir/spec.md" ]; then
      phase="2. Spec"
    elif [ ! -f "$dir/plan.md" ]; then
      phase="3. Clarificacion o 4. Plan"
    elif [ ! -f "$dir/tasks.md" ]; then
      phase="5. Tareas"
    else
      phase="cerrada"
    fi
  fi

  printf '  %-24s spec %s  plan %s  tasks %s\n' "$name" "$spec_mark" "$plan_mark" "$tasks_mark"
  [ -n "$detail" ] && echo "   ->$detail"

  # Se recogen todas las abiertas: elegir entre ellas es del usuario, no del
  # script. Las que solo esperan validacion no compiten con una en curso.
  if [ "$phase" != "cerrada" ]; then
    open_names+=("$name")
    open_phases+=("$phase")
    case "$phase" in
      7.*) ;;
      *) running=$((running + 1)) ;;
    esac
  fi
done

open_count="${#open_names[@]}"

# Candidatas: las que estan en curso; si ninguna lo esta, las que esperan
# validacion. Con want_spec, manda lo que pida el usuario.
candidates=""
i=0
while [ "$i" -lt "$open_count" ]; do
  name="${open_names[$i]}"
  phase="${open_phases[$i]}"
  in_progress="si"
  case "$phase" in 7.*) in_progress="no" ;; esac
  if [ -n "$want_spec" ]; then
    [ "$name" = "$want_spec" ] && { active_dir="$name"; active_phase="$phase"; }
  elif [ "$running" -eq 0 ] || [ "$in_progress" = "si" ]; then
    candidates="${candidates:+$candidates, }$name"
    active_dir="$name"
    active_phase="$phase"
    cand_count=$((${cand_count:-0} + 1))
  fi
  i=$((i + 1))
done

echo
if [ "$found_any" = "no" ]; then
  echo "Spec activa: ninguna"
  echo "Siguiente fase: 2. Spec"
elif [ -n "$want_spec" ] && [ -z "$active_dir" ]; then
  echo "Spec activa: sin determinar"
  echo "La spec pedida ($want_spec) no existe o esta cerrada."
  exit 0
elif [ "${cand_count:-0}" -gt 1 ]; then
  echo "Spec activa: sin determinar (${cand_count} en curso: $candidates)"
  echo "Siguiente fase: pregunta al usuario cual seguir y vuelve a ejecutar:"
  echo "  sdd-status.sh $root <spec>"
elif [ -n "$active_dir" ]; then
  echo "Spec activa: $active_dir"
  echo "Siguiente fase: $active_phase"
  if [ -z "$want_spec" ] && [ "$open_count" -gt 1 ]; then
    echo "Nota: hay $open_count specs abiertas; el resto solo espera validacion."
  fi
else
  echo "Spec activa: ninguna (todas cerradas)"
  echo "Siguiente fase: 8. Proximos pasos (ampliar) o 2. Spec (funcionalidad nueva)"
fi
