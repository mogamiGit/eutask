# Constitución — <nombre-del-proyecto>

Reglas innegociables. Un cambio que incumpla cualquiera de ellas no se acepta.

1. **Simplicidad primero.** <Lenguaje y versión mínima. Cuántos conceptos de
   dominio hay. Qué dependencias se permiten; cualquier otra exige spec aprobada.>
2. **Relación spec↔código.** <Este principio fija el modo SDD del proyecto.
   Escribe uno de los dos, no ambos:
   — anchored: «Todo cambio de comportamiento empieza en `specs/`. Si el código
   y la spec discrepan, gana la spec y se corrige el código.»
   — first: «La spec fija el alcance antes de implementar; una vez validada, no
   se mantiene sincronizada. La fuente de verdad pasa a ser el código.»>
3. **Núcleo puro.** <Qué fichero contiene la lógica y qué tiene prohibido
   importar. La interfaz solo parsea entrada, llama al núcleo e imprime.>
4. **Tests siempre.** <Qué se testea sin excepción. Cada bug empieza por un test
   que falla. Qué comando debe pasar antes de cada commit.>
5. **Persistencia simple y explícita.** <Dónde y en qué formato viven los datos,
   desde qué módulo se escriben, cómo se validan al leer. Cambiar el formato
   exige actualizar la spec y migrar los datos existentes.>
6. **Idioma.** <Qué va en inglés (identificadores, tipos, comentarios) y qué en
   español (mensajes al usuario, documentación). Sin mezclas.>
