# Plan técnico — Spec NNN

<Una frase: qué se diseña aquí y a qué spec responde.>
Cada sección indica entre paréntesis los RF que cubre.

## 1. Módulos

| Módulo | Responsabilidad | Puede importar | RF |
|---|---|---|---|
| `<ruta>` | <qué hace> | <qué tiene permitido> | <RF-n> |

### API del núcleo

<Firmas con tipos, sin cuerpo. Una línea de descripción por función.>

## 2. Modelo de datos (RF-n)

<Esquema y significado de cada campo.>

Ejemplo real del fichero:

```json
{}
```

<Qué ocurre al leer datos escritos por una versión anterior.>

## 3. <Algoritmo no trivial> (RF-n)

```
<pseudocódigo>
```

<Casos límite del algoritmo y qué devuelve en cada uno.>

## 4. Contrato de la interfaz (RF-n)

| Caso | Entrada | stdout / stderr | Código de salida |
|---|---|---|---|
| <caso> | `<comando>` | <salida esperada> | 0 / 1 |

## 5. Decisiones técnicas

1. **<Decisión>.** <Por qué.> *Alternativa descartada:* <cuál y por qué no.>

## 6. Tests

- **Núcleo:** <qué se prueba y con qué casos.>
- **Interfaz:** <qué se prueba.>
- **Extremo a extremo:** <una fila de la tabla del contrato por caso.>
- **Aislamiento:** <directorio temporal, variable de entorno, reloj inyectado.>

## Cobertura

| RF | Sección que lo cubre |
|---|---|
| RF-1 | <sección> |
