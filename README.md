# Ruleta Exeltis

Aplicación interactiva portable, offline y autocontenida para una dinámica tipo concurso con selección de participantes y ruleta de PPIs.

## Cómo ejecutar

Abre `index.html` en el navegador. No requiere servidor, instalación ni internet.

## Qué incluye

- Selector y administración de módulos.
- Participantes independientes por módulo.
- PPIs con temas o imagen relacionada.
- Vista principal para evento, lista para compartir por Zoom o proyector.
- Modo evento flexible: usar Personas + PPIs, solo Personas o solo PPIs.
- Sorteo de participante con animación.
- Ruleta animada para PPIs.
- Modo show tipo concurso de TV ("Excelerate") con escenas separadas:
  splash, sorteo de participante (tómbola), ruleta de PPI y resultado,
  con cortinillas, sonidos y confeti. Se activa con el botón "Vista show"
  y respeta el modo de evento (Personas, PPIs o ambos).
- Aleatoriedad por bolsa barajada para evitar repetidos consecutivos y distribuir mejor los turnos.
- Audio activable/desactivable.
- Historial de rondas por módulo.
- Importación y exportación de JSON.
- Instructivo en `docs/instructivo.html` y `docs/instructivo.pdf`.

## Datos reales

La versión actual no contiene datos demo. Para preparar producción:

1. Abre el panel.
2. Captura participantes y PPIs de cada módulo.
3. Exporta el JSON final.
4. Conserva ese archivo como respaldo de producción.

También puedes usar `assets/data/modules.json` como formato base para armar los datos manualmente e importarlos desde el panel.

## Estructura sugerida

- `index.html`: archivo principal.
- `styles.css`: estilos visuales y responsivos.
- `app.js`: lógica de la dinámica.
- `assets/data/modules.json`: estructura base para datos.
- `assets/images/`: imágenes locales asociadas a PPIs.
- `assets/audio/`: sonidos incluidos.
- `docs/`: instructivo de operación.
