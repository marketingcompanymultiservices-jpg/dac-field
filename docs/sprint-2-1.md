# Sprint 2.1 - Persistencia local temporal

Este sprint agrega persistencia temporal con `localStorage` sobre el Store Global creado en Sprint 2.0.

## Arquitectura

Se creo `lib/storage.ts` con tres helpers:

- `saveAppState()`: guarda el estado completo de DAC en `localStorage`.
- `loadAppState()`: restaura el estado guardado si existe y es valido.
- `clearAppState()`: elimina los datos locales guardados.

El `ProjectStoreProvider` carga datos guardados solamente del lado cliente usando `useEffect`. Si no encuentra datos en `localStorage`, conserva los datos mock iniciales.

## Datos persistidos

La version actual guarda:

- Proyecto.
- Actividades.
- Registros diarios.
- Fotografias simuladas.
- Compromisos.
- Documentos.
- Reportes.
- Bitacora calculada.
- Avance calculado.

## Interfaz

- El header muestra el indicador `Datos guardados localmente`.
- Dashboard incluye el boton `Reiniciar datos de prueba`.
- Antes de reiniciar, el navegador solicita confirmacion.

## Alcance excluido

- No hay backend.
- No hay Supabase.
- La persistencia vive solo en el navegador actual.
