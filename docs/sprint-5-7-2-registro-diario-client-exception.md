# Sprint 5.7.2 - Excepcion frontend despues de guardar Registro Diario

## Problema

Despues de guardar un Registro Diario desde celular, la aplicacion podia mostrar:

`Application error: a client-side exception has occurred.`

El guardado en Supabase ya no era el punto principal; el riesgo estaba en operaciones posteriores al RPC.

## Correccion

- `localStorage` ahora esta protegido con `try/catch`.
- Las fotografias con `image_data` no se persisten en `localStorage`, evitando `QuotaExceededError` en moviles.
- La lectura de previews en Registro Diario y Modo Obra queda protegida.
- La vista del Reporte Diario queda protegida si falla la hidratacion de imagenes.
- `imageStorage` ahora ignora una foto puntual si no puede leerla, sin romper toda la pantalla.

## Logs agregados

Los errores controlados registran:

- stack completo disponible;
- archivo;
- funcion;
- linea indicada para revisar con sourcemap/build;
- mensaje original.

## Resultado esperado

Si algo falla despues de `save_daily_report_bundle(payload)`, DAC muestra un mensaje amigable y mantiene la pantalla operativa.
