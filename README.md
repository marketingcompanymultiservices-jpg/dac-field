# DAC - Doble Altura Control

Sistema Integral de Gestión de Obras.

Lema: "Construimos información con la misma precisión con la que construimos obras."

## Sprint 1

Esta base incluye:

- Next.js con TypeScript.
- Tailwind CSS con identidad visual de Doble Altura Control.
- Cliente Supabase preparado en `lib/supabase.ts`.
- Login simulado con usuario de prueba.
- Dashboard Director.
- Obra piloto: Quintas de Acuarela.
- Centro de Control de Obra.
- Registro Diario inicial.
- Bitácora inicial.
- Esquema inicial PostgreSQL en `database/schema.sql`.

## Usuario de prueba

- Correo: `jose@doblealtura.com`
- Contraseña: `admin123`

## Ejecutar localmente

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

3. Abrir:

```text
http://localhost:3000
```

## Supabase

Para autenticacion real y activacion de usuarios, crear un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_solo_servidor
SUPABASE_SERVICE_KEY=alias_opcional_si_ya_lo_tienes_configurado
```

La aplicacion conserva datos operativos locales mientras se completa la migracion total a backend.

## Sprint 1.1

Mejora del Registro Diario para celular:

- Formulario por 8 pasos.
- Barra de progreso superior con indicador "Paso X de 8".
- Navegación Anterior / Siguiente.
- Acciones Guardar borrador y Enviar registro.
- Actividades ejecutadas en lista temporal.
- Compromisos múltiples con estado inicial Pendiente.
- Carga simulada de mínimo 5 fotografías con contador.
- Resumen completo antes de enviar.

## Sprint 1.2

Módulo Avance de Obra:

- Ruta `/projects/[projectId]/progress`.
- Botón Avance conectado desde el Centro de Control.
- Presupuesto mock con actividades, cantidades, valores y porcentaje ejecutado.
- Avance general ponderado por valor total y porcentaje de avance.
- Tarjetas de resumen financiero y físico.
- Tabla responsive con barra de progreso por actividad.
- Filtros: Todas, Finalizadas, En ejecución y Sin iniciar.
- Pendiente para sprint futuro: carga real de presupuesto desde Excel.

## Sprint 1.3

Módulo Compromisos:

- Ruta `/projects/[projectId]/commitments`.
- Botón Compromisos conectado desde el Centro de Control.
- Mock local de compromisos con responsable, fecha límite, prioridad, estado y origen.
- Tarjetas superiores para total, pendientes, en proceso, vencidos, cumplidos y críticos.
- Filtros: Todos, Pendientes, En proceso, Vencidos, Cumplidos y Alta / Crítica.
- Formulario local para agregar compromisos con estado inicial Pendiente.
- Acciones locales por compromiso: Marcar en proceso y Marcar cumplido.

## Sprint 1.4

Módulo Documentos:

- Ruta `/projects/[projectId]/documents`.
- Botón Documentos conectado desde el Centro de Control.
- Expediente digital con carpetas iniciales de obra.
- Mock local de documentos con versión, estado, fechas, usuario y observación.
- Tarjetas superiores para total, vigentes, próximos a vencer, reemplazados y carpetas activas.
- Panel de carpetas, filtros por estado y buscador.
- Formulario local para agregar documentos con archivo simulado.

## Sprint 1.5

Modulo Reportes:

- Ruta `/projects/[projectId]/reports`.
- Boton Reportes conectado desde el Centro de Control.
- Mock local de reportes generados y borradores.
- Panel para generar reportes simulados en PDF o Excel.
- Opciones para incluir fotografias, compromisos y observaciones de interventoria.
- Tarjetas superiores para total, generados, borradores, ultimo reporte generado y tipos disponibles.
- Filtros: Todos, Generados, Borradores, Diario, Semanal, Mensual, Fotografico, Avance, Compromisos y Documental.
- Acciones simuladas: Ver, Descargar y Eliminar borrador.
- Pendiente para sprint futuro: generacion real de PDF/Excel y persistencia en Supabase.

## Sprint 1.6

Pulido de interfaz y navegacion:

- Layout general reutilizable con header superior, logo DA, usuario conectado y boton Salir.
- Navegacion consistente entre Dashboard, Obra, Registro Diario, Bitacora, Avance, Documentos, Reportes y Compromisos.
- Boton Volver integrado al layout cuando aplica.
- Encabezado reutilizable para modulos principales.
- Mejoras responsive para celular con navegacion horizontal y tarjetas mas consistentes.
- Unificacion visual de botones, tarjetas, sombras, colores y espaciados.
- Se mantiene placeholder DA porque no existe logo real en `/public`.

## Sprint 2.0

Registro Diario como centro de la plataforma:

- Store global con Context API en `lib/project-store.tsx`.
- Toda la app comparte proyecto, actividades, registro diario, fotografias, compromisos, documentos, avance, bitacora y reportes en memoria.
- Registro Diario actualiza automaticamente Avance, Dashboard, Bitacora, Compromisos y Reportes.
- Motor de avance dinamico: calcula cantidad acumulada, cantidad pendiente, porcentaje ejecutado y estado por actividad.
- Dashboard deja de depender de numeros fijos y usa metricas derivadas del store.
- Bitacora muestra eventos automaticos creados desde actividades, compromisos y fotografias.
- Vista previa de Reportes usa informacion real registrada en memoria.
- No se implementa backend ni Supabase todavia.

## Sprint 2.1

Persistencia local temporal:

- Se agrega `localStorage` para que la informacion no se pierda al recargar la pagina.
- Helper de almacenamiento en `lib/storage.ts` con `saveAppState`, `loadAppState` y `clearAppState`.
- El Store Global carga datos locales al iniciar la app y usa mocks iniciales si no hay informacion guardada.
- Se persisten proyecto, actividades, registros diarios, fotografias simuladas, compromisos, documentos, reportes, bitacora y avance calculado.
- Header con indicador `Datos guardados localmente`.
- Dashboard incluye boton `Reiniciar datos de prueba` con confirmacion antes de borrar.
- No hay backend ni Supabase; la persistencia vive solo en el navegador actual.

## Sprint 2.2

Modulo maestro de Presupuesto:

- Ruta `/projects/[projectId]/budget`.
- Boton Presupuesto conectado desde el Centro de Control y la navegacion superior.
- Componentes reutilizables `BudgetSummary`, `BudgetTable`, `BudgetFilters` y `BudgetImportCard`.
- El presupuesto queda como fuente oficial futura para control fisico y financiero.
- Estructura preparada para importar Excel: item, descripcion, unidad, cantidad, valor unitario, valor total, capitulo y subcapitulo.
- Filtros por capitulo, subcapitulo, estado y busqueda de actividad.
- Botones simulados para importar y exportar presupuesto.
- No se modifica todavia el modulo Avance.

## Sprint 2.3

Presupuesto conectado con Avance:

- El presupuesto global es la fuente oficial de actividades para Avance.
- Avance ya no usa mocks separados; calcula desde `budgetItems` y las cantidades del Registro Diario.
- Registro Diario permite buscar y seleccionar actividades del presupuesto.
- Al registrar una actividad se guarda el item presupuestal y se valida que la cantidad de hoy no supere el pendiente.
- Avance recalcula ejecutado acumulado, pendiente, porcentaje, estado, valor ejecutado y valor pendiente.
- Presupuesto muestra columnas calculadas: ejecutado acumulado, pendiente, porcentaje ejecutado y estado.
- La persistencia localStorage conserva las actividades registradas y recalcula los avances al recargar.

## Sprint 2.4

Importador de Presupuesto Excel:

- La ruta `/projects/[projectId]/budget` permite cargar archivos `.xlsx` o `.xls`.
- Se usa la libreria `xlsx` para leer la primera hoja del archivo en el navegador.
- DAC detecta automaticamente columnas como item, descripcion, unidad, cantidad, valor unitario, valor total y porcentaje.
- Antes de importar se muestra una vista previa de las primeras 10 actividades detectadas.
- Al confirmar, el presupuesto actual se reemplaza y se reinicia el avance calculado.
- El presupuesto importado se guarda en el Store Global y persiste en `localStorage`.
- Avance, Dashboard y Registro Diario usan inmediatamente las actividades reales importadas.
- Se guarda metadata de version: archivo, fecha de importacion, usuario, total de actividades y valor total importado.
- Se muestran errores claros cuando el archivo no es Excel, faltan columnas minimas, no hay actividades validas o existen valores numericos invalidos.

## Sprint 2.5

Validacion y auditoria de importacion Excel:

- Antes de confirmar una importacion, DAC muestra una seccion de validacion del archivo.
- El resumen incluye archivo, filas leidas, actividades validas, capitulos, subcapitulos, filas descartadas y valor total detectado.
- Se muestran las primeras 20 actividades validas y las primeras 20 filas descartadas con motivo.
- Motivos de descarte: fila vacia, falta unidad, falta cantidad, falta valor total, capitulo, subcapitulo, subtotal, total general y valor invalido.
- Se agregan botones `Confirmar importacion` y `Cancelar`.
- Al cancelar, el presupuesto anterior queda intacto.
- Al confirmar, se reemplaza el presupuesto maestro, se crea nueva version, se reinicia el avance calculado y se guarda metadata en localStorage.
- No se permite importar si no hay actividades validas, si el valor total es 0 o si faltan columnas obligatorias.
- Se ignoran filas de subtotal, total, costo directo, administracion, imprevistos, utilidad, IVA, AIU y costos de obra.

## Sprint 2.6

Registro Diario como centro operativo:

- Se elimina el ingreso libre de actividades en Registro Diario.
- Toda ejecucion debe provenir del Presupuesto Maestro.
- El buscador de actividades permite buscar por item, descripcion, capitulo y subcapitulo.
- Al seleccionar una actividad se muestran sus datos tecnicos, cantidades, valores, avance y estado.
- El residente registra cantidad ejecutada hoy, observacion, frente, responsable, hora inicio, hora final, fotografias y compromiso opcional.
- Se bloquean cantidades negativas, cero, no numericas o mayores al pendiente.
- Cada ejecucion queda asociada al item presupuestal con `budgetItemId`.
- El historial nunca se sobrescribe; cada registro diario agrega una nueva entrada.
- Nueva ficha por actividad en `/projects/[projectId]/activities/[activityId]`.
- Presupuesto incluye boton `Ver actividad` para abrir la ficha.
- Avance, Dashboard, Bitacora, Reportes y Compromisos se alimentan desde los registros asociados al presupuesto.

## Sprint 2.7

Levantamiento Inicial de Obra:

- Nueva ruta `/projects/[projectId]/initial-survey`.
- Boton `Levantamiento Inicial` conectado desde el Centro de Control.
- Muestra todas las actividades del Presupuesto Maestro.
- Permite editar el `Ejecutado inicial` por actividad.
- Calcula pendiente inicial, porcentaje inicial, valor ejecutado inicial y estado.
- Valida que no existan valores negativos, no numericos o superiores a la cantidad contratada.
- Al guardar actualiza el punto de partida del avance usando `initialProgress`.
- Avance y Dashboard se recalculan automaticamente.
- Cada guardado crea evento en Bitacora: `Levantamiento inicial actualizado.`
- Guarda fecha del levantamiento y usuario `Jose Martinez`.
- Incluye filtros por estado y busqueda por item o descripcion.
- Incluye exportacion simulada del levantamiento.

## Sprint 2.8

Reporte Diario Real:

- Nueva ruta `/projects/[projectId]/daily-report/[reportId]`.
- El reporte lee informacion real del Store Global.
- Registro Diario guarda informacion general, personal, contratistas, equipos, materiales, observaciones, problemas, acciones y firma.
- La vista cruza actividades, compromisos y fotografias por fecha del reporte.
- Se agrega boton `Ver reporte diario` desde Registro Diario y Bitacora.
- Estructura tipo informe con encabezado DAC, datos de obra, codigo, fecha, residente y estado.
- Secciones: informacion general, personal, equipos/materiales, actividades, observaciones, problemas/acciones, compromisos, fotografias y firma.
- Resumen automatico de jornada con actividades, compromisos y fotografias.
- Acciones: Volver, Imprimir y Descargar PDF simulado.
- `Imprimir` usa `window.print()`.
- El PDF real queda pendiente para un sprint futuro.

## Sprint 3.0

Fotografias reales desde navegador y celular:

- Registro Diario reemplaza fotografias simuladas por carga real de imagenes.
- Permite tomar foto desde celular o seleccionar varias imagenes desde galeria.
- Formatos permitidos: JPG, JPEG, PNG y WEBP.
- Tamano maximo por foto: 5 MB.
- Contador `Fotos cargadas X/5` con minimo recomendado de 5 fotos.
- Previsualizacion con miniatura, descripcion editable, actividad asociada opcional y eliminacion antes de enviar.
- Metadata de fotos en Store Global y persistencia liviana en `localStorage`.
- Imagenes guardadas en IndexedDB mediante `lib/imageStorage.ts` para evitar saturar `localStorage`.
- Al guardar el Registro Diario, las fotos quedan asociadas al reporte diario.
- Reporte Diario Real muestra las fotografias reales cargadas.
- Ficha individual de actividad muestra fotografias asociadas desde Registro Diario.
- Bitacora registra el evento `Se cargaron X fotografias al registro diario.`
- Supabase Storage y PDF fotografico definitivo quedan pendientes para una integracion futura.

## Branding 01

Identidad corporativa oficial:

- Logo oficial guardado en `public/branding/logo.png`.
- Favicon creado desde el isotipo en `public/favicon.png`.
- Nuevo componente `AppLogo` con deteccion automatica: primero `logo.svg`, luego `logo.png`, y finalmente placeholder `DA`.
- Nuevo componente `AppBrand` para mostrar logo, nombre, subtitulo y lema.
- Login, header general, Centro de Control, Dashboard, Reporte Diario e impresion usan la marca reutilizable.
- En celular la marca se resume como logo + `DAC`.
- En escritorio se muestra `Doble Altura Control` y `Sistema Integral de Gestion de Obras`.
- Metadata actualizada: `DAC | Doble Altura Control`.

## Sprint 3.1

Modulo Administracion:

- Nueva ruta `/admin`.
- Menu `Administracion` agregado a la navegacion general.
- Submodulos: Empresa, Usuarios, Roles y Permisos.
- Empresa editable con nombre, NIT, direccion, ciudad, correo, telefono, logo y subdominio futuro.
- CRUD local de usuarios con crear, editar, activar/desactivar y eliminar.
- Usuarios iniciales: Jose Martinez, Hernan Aristizabal, Oscar Ospina y Oliver Mora.
- Roles iniciales editables: Administrador, Director, Residente, Interventoria, Supervisor Tecnico y Consulta.
- Matriz de permisos por rol con switches para Ver, Crear, Editar, Eliminar, Exportar y Administrar.
- Header general muestra usuario conectado, rol y empresa.
- La informacion administrativa vive en Store Global y persiste en `localStorage`.
- Queda preparada la estructura para futura autenticacion con Supabase, sin implementar seguridad real todavia.

## Sprint 3.2

Planificacion Semanal:

- Ruta `/projects/[projectId]/planning`.
- Boton `Planificación` en menu principal y Centro de Control.
- Las actividades provienen exclusivamente del Presupuesto Maestro.
- Formulario semanal con actividad, cantidad programada, responsable, fecha inicio, fecha fin y prioridad.
- Prioridades: Alta, Media y Baja.
- Estados automaticos: Pendiente, En ejecucion, Finalizada y Atrasada.
- Tabla con ITEM, Actividad, Unidad, Cantidad programada, Responsable, Fecha inicio, Fecha fin, Prioridad y Estado.
- Filtros por semana, responsable, prioridad y estado.
- Tarjetas: Actividades programadas, terminadas, pendientes y cumplimiento semanal.
- El avance del Registro Diario actualiza automaticamente cantidad ejecutada, porcentaje y estado de la programacion.
- Si llega la fecha final y no se completa, la actividad queda como Atrasada.
- Boton `Duplicar semana` para copiar una programacion semanal hacia otra semana.
- Boton `Exportar programacion` con simulacion.
- Cada nueva planificacion registra evento en Bitacora.
- Persistencia en Store Global y `localStorage`.

## Sprint 3.3

Evidencia fotografica real:

- Registro Diario permite tomar foto desde celular, seleccionar desde galeria y cargar varias imagenes.
- Fotos reales con previsualizacion, descripcion editable, actividad asociada y eliminacion antes de enviar.
- Validacion de JPG, JPEG, PNG y WEBP con maximo 5 MB por foto.
- Contador `Fotos cargadas X/5` con minimo recomendado de 5 fotos.
- Imagenes comprimidas en navegador cuando es posible.
- Metadata en Store Global y `localStorage`.
- Imagenes almacenadas en IndexedDB mediante `lib/imageStorage.ts`.
- Cada foto puede quedar asociada a Registro Diario, Reporte Diario y Actividad.
- Reporte Diario muestra fotografias reales del registro.
- Ficha de Actividad muestra fotografias asociadas por `activityId`.
- Bitacora registra `Se cargaron X fotografias al registro diario.`
- Reportes muestra conteo real de fotos por reporte diario.
- Al reiniciar datos de prueba se limpian tambien las imagenes de IndexedDB.
- PDF con imagenes embebidas queda pendiente para un sprint futuro; la vista en pantalla e impresion ya muestra miniaturas reales.

## Sprint 3.4

Programado vs Ejecutado y Curva S basica:

- Nueva seccion dentro de `/projects/[projectId]/progress`.
- Calcula avance programado desde Planificacion Semanal.
- Calcula avance ejecutado desde cantidades registradas en Registro Diario.
- Indicadores: avance programado, avance ejecutado, desviacion, actividades atrasadas y cumplimiento semanal.
- Tabla comparativa con ITEM, Actividad, Unidad, Programado, Ejecutado, Diferencia, % Cumplimiento y Estado.
- Estados: En tiempo, Atrasada, Adelantada y Sin programacion.
- Filtros por semana, capitulo, estado y responsable.
- Curva S basica en SVG sin librerias externas.
- Dashboard agrega tarjeta `Desviacion Programado vs Ejecutado`.
- Reportes agrega tipo `Reporte Programado vs Ejecutado`.
- PDF real de este reporte queda pendiente para un sprint futuro.

## Sprint 3.5

Centro de Alertas Inteligentes:

- Nueva ruta `/projects/[projectId]/alerts`.
- Boton `Alertas` en menu principal, Centro de Control y Dashboard.
- Bandeja con tipo, prioridad, fecha, proyecto, actividad relacionada, responsable, estado y accion recomendada.
- Tipos: actividad atrasada, compromiso vencido, registro diario faltante, registro sin fotografias, actividad sin movimiento, planificacion vencida, documento pendiente y observacion de interventoria pendiente.
- Prioridades: Critica, Alta, Media y Baja.
- Estados: Nueva, En proceso, Atendida y Cerrada.
- Tarjetas superiores: Total alertas, Criticas, Pendientes y Atendidas.
- Filtros por prioridad, estado, responsable, tipo y fecha.
- Cada alerta permite Ver detalle, marcar En proceso, marcar Atendida y Cerrar.
- Reglas automaticas calculadas desde Planificacion, Registro Diario, Fotografias, Compromisos y Documentos.
- Dashboard mantiene indicador de alertas criticas.
- Bitacora registra creacion y cambio/cierre de alertas.
- Persistencia en Store Global y `localStorage`.

## Sprint 3.6

Indicadores de Productividad:

- Nueva seccion `Productividad` dentro de `/projects/[projectId]/progress`.
- Calcula productividad por actividad desde cantidades registradas en Registro Diario.
- Calcula cantidad ejecutada total, dias con movimiento, promedio diario, ultimo avance, valor ejecutado, responsable y estado.
- Calcula productividad por responsable con actividades registradas, cantidad ejecutada, valor ejecutado, compromisos y alertas asociadas.
- Tarjetas superiores: produccion total registrada, valor ejecutado acumulado, promedio diario, actividades con movimiento esta semana y actividades sin movimiento.
- Tabla profesional por actividad con filtros por capitulo, responsable, semana, estado y busqueda.
- Rankings de actividades con mayor produccion y menor movimiento.
- Dashboard agrega tarjeta `Productividad semanal`.
- Reportes agrega tipo `Reporte de Productividad`.
- Alertas agrega regla sugerida `Actividad con baja productividad` cuando una actividad programada no registra avance reciente en mas de 3 dias.
- No se implementa backend ni Supabase; los indicadores se calculan desde Store Global y persistencia local.

## Sprint 3.7

Modo Obra:

- Nueva ruta `/field`.
- Acceso desde Dashboard, navegacion principal y Centro de Control.
- Experiencia simplificada para celular con botones grandes, tarjetas simples y navegacion inferior fija.
- Pantalla principal con obra activa, registrar dia, tomar fotografias, actividades de hoy, compromisos, enviar reporte y sincronizacion local.
- Registro Diario compacto con clima, personal, actividades, fotografias, observaciones y envio.
- Las actividades siguen viniendo del Presupuesto Maestro y de la Planificacion Semanal.
- Actividades de hoy muestra la programacion vigente para la fecha actual.
- Boton grande `Tomar foto` usa camara del celular o galeria con el flujo existente de IndexedDB.
- Compromisos muestra pendientes, vencidos y mios, y permite crear compromisos rapidos.
- Indicadores: datos guardados localmente, fotos pendientes y reporte enviado/no enviado.
- Enviar reporte guarda un reporte diario compacto en el Store Global.
- No se reemplazan las pantallas completas existentes; Modo Obra es una vista adicional para operacion en campo.

## Sprint 3.8

Centro de Control del Director:

- El Dashboard existente se reemplaza por un tablero ejecutivo completo en `/dashboard`.
- Nuevo componente `DirectorControlCenter` como Home principal del Director Administrativo y Director de Obra.
- Resumen general con proyecto activo, avance fisico, avance programado, desviacion, valor ejecutado, valor pendiente, ultimo registro, ultima sincronizacion y estado del proyecto.
- Actividad de hoy con registro diario recibido, fotos cargadas, actividades ejecutadas y responsable.
- Alertas criticas muestra solo alertas Criticas y Altas, con acceso a Ver todas.
- Productividad muestra produccion semanal, actividades con mayor avance y actividades sin movimiento.
- Compromisos resume pendientes, vencidos y cumplidos.
- Planeacion resume actividades programadas esta semana, atrasadas y cumplimiento semanal.
- Evidencia muestra fotografias cargadas hoy y ultimo reporte enviado.
- Accesos rapidos grandes: Registro Diario, Avance, Presupuesto, Reportes, Alertas, Planificacion, Modo Obra y Centro de Control.
- Indicadores de Obra muestra actividades totales, finalizadas, en ejecucion y sin iniciar.
- Se agrega estructura de portafolio preparada para multiples proyectos.
- No se implementa backend ni Supabase; todo se calcula desde Store Global y persistencia local.

## Sprint 3.9

QA Integral y Estado del Sistema:

- Nueva ruta `/system/health`.
- Acceso `Estado del Sistema` agregado desde Administracion.
- Pantalla de diagnostico con estado general, version DAC, sistema operativo, ultima actualizacion y estado global.
- Diagnostico de datos: actividades sin presupuesto, duplicadas, compromisos huerfanos, reportes sin actividades, fotografias sin reporte, usuarios sin rol y roles sin permisos.
- Diagnostico de rendimiento: total de actividades, registros diarios, fotografias, documentos y reportes.
- Diagnostico de integridad para Presupuesto, Registro Diario, Avance, Reportes, Bitacora, Alertas, Planificacion, Productividad, Modo Obra y Dashboard.
- Validacion de navegacion para todas las rutas principales.
- Validacion de almacenamiento para Store Global, localStorage e IndexedDB, con uso aproximado del navegador cuando esta disponible.
- Boton `Ejecutar diagnostico` con barra de progreso.
- Resumen automatico del sistema: Excelente, Bueno o Requiere atencion.
- Cada ejecucion registra evento en Bitacora mediante `addSystemEvent`.
- No se implementa backend ni Supabase; es una revision local de calidad y estabilidad.

## Sprint 4.0

Preparacion DAC Field v1.0.0:

- Configuracion central creada en `lib/appConfig.ts`.
- Servicio de entorno creado en `lib/environment.ts`.
- Nueva pantalla `/about` con logo, nombre del sistema, version, empresa, fecha de compilacion y creditos.
- Footer global con indicador `DAC Field v1.0.0` y ambiente actual.
- Archivo `.env.example` preparado para variables publicas y futuras credenciales Supabase.
- `Estado del Sistema` incorpora seccion `Estado de despliegue`.
- Validaciones de despliegue: localStorage, IndexedDB, Store Global, PDF, Camara, Reportes y Presupuesto.
- Boton `Exportar configuracion` genera un JSON con la configuracion de la aplicacion y capacidades locales.
- Documentacion de salida en `docs/v1-release.md`.
- No se implementa backend ni Supabase; la aplicacion queda preparada para publicacion futura.

## Sprint 5.1

Supabase + Login Real + Roles Iniciales:

- Cliente Supabase creado en `lib/supabaseClient.ts`.
- Variables agregadas a `.env.example`: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `AuthProvider` creado en `components/AuthProvider.tsx`.
- Login simulado reemplazado por login real con Supabase Auth.
- Si Supabase no esta configurado, el login muestra `Supabase no está configurado.`
- Rutas internas protegidas: sin sesion activa redirigen a `/`.
- Header actualizado para mostrar usuario autenticado real y rol local.
- Logout real con Supabase.
- Roles base: Administrador, Director Administrativo, Residente de Obra, Interventoria, Supervisor Tecnico, Auxiliar Administrativa y Consulta.
- Usuarios iniciales preparados: Jose, Hernan, Oscar, Oliver y Juliana.
- Permisos de Auxiliar Administrativa limitados a ver, descargar/imprimir reportes y exportar documentos.
- Auditoria local en Bitacora para inicio/cierre de sesion, descarga de informe, impresion de reporte y exportacion de documento.
- Se mantienen mocks temporales para proyectos, presupuesto, avance, reportes y documentos.

## Sprint 5.2

Integracion Supabase:

- Clientes Supabase separados para navegador y servidor en `lib/supabase/browser.ts` y `lib/supabase/server.ts`.
- Compatibilidad conservada en `lib/supabaseClient.ts`.
- Helper `lib/supabase/profiles.ts` para crear el perfil del usuario despues del primer inicio de sesion.
- `AuthProvider` sincroniza el usuario autenticado con `public.profiles`.
- Migracion SQL generada en `database/sprint-5-2-profiles.sql`.
- Tabla `profiles`: id, nombre, correo, rol, activo y created_at.
- RLS habilitado para `profiles`.
- Politicas base: Administrador con acceso total, Director con lectura/escritura y Secretaria/Auxiliar Administrativa con lectura.
- Variables requeridas: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No se modifico la interfaz ni se migraron datos de proyectos, presupuesto, avance, reportes o documentos.

## Sprint 5.3

Edicion de avance y cantidades del presupuesto:

- El modulo Presupuesto agrega modo de edicion por actividad.
- Campos editables: cantidad presupuestada real, cantidad ejecutada acumulada, responsable de actualizacion y observacion.
- Campos contractuales bloqueados: ITEM, descripcion, unidad y valor unitario.
- Al guardar se recalculan valor total, cantidad pendiente, porcentaje ejecutado, valor ejecutado, valor pendiente y estado.
- Validaciones para impedir valores negativos, no numericos, cantidad ejecutada mayor que la cantidad presupuestada o cantidad presupuestada menor que la cantidad ejecutada.
- Avance se actualiza automaticamente con las cantidades editadas desde el Presupuesto Maestro.
- Cada edicion genera historial de cambios con cantidad anterior, cantidad nueva, diferencia, usuario, fecha, observacion y origen.
- Las correcciones de cantidad presupuestada generan historial propio con cantidad base anterior y nueva.
- Presupuesto incluye seccion `Historial de cambios de avance`.
- Bitacora registra el evento de actualizacion manual de avance.
- Reportes incorpora el conteo de actualizaciones manuales en el resumen de avance.
- La persistencia se mantiene en Store Global y `localStorage`; no se migra informacion a Supabase en este sprint.

## Sprint 5.4C

Activacion de usuarios por administrador:

- Administracion > Usuarios permite crear/activar usuarios reales usando correo y contrasena temporal.
- La creacion de usuarios usa una ruta servidor protegida: `/api/admin/users`.
- Se requiere `SUPABASE_SERVICE_ROLE_KEY` solo del lado servidor para crear usuarios en Supabase Auth.
- Cada usuario queda sincronizado con `public.profiles` con rol, estado activo/inactivo y `must_change_password`.
- Los usuarios con contrasena temporal son enviados obligatoriamente a `/change-password`.
- Al cambiar la contrasena, Supabase Auth actualiza la clave y `profiles.must_change_password` pasa a `false`.
- Migracion requerida: `database/sprint-5-4c-user-activation.sql`.
- El login actual se conserva sin cambios.

## Sprint 5.5

Inspecciones de Direccion:

- Nuevo modulo `/projects/[projectId]/direction-inspections`.
- Acceso desde menu principal y Centro de Control de Obra.
- Permite crear inspecciones independientes del Registro Diario.
- Campos: obra, fecha automatica, director autenticado, responsable, estado, ubicacion, clasificacion, prioridad, descripcion, fotografias y compromiso.
- Seguimiento con respuesta del responsable, evidencias de correccion, fecha de atencion, cierre y reapertura.
- Dashboard interno con pendientes, en proceso, cerradas, vencidas, por responsable y por clasificacion.
- Auditoria local con historial completo de cambios por inspeccion.
- Fotografias almacenadas con el helper IndexedDB existente, asociadas por `inspectionId`.
- Migracion preparada: `database/sprint-5-5-direction-inspections.sql`.

## Sprint 5.5.1

Conexion Supabase para Inspecciones de Direccion:

- El modulo carga inspecciones desde `public.direction_inspections`.
- Al crear una inspeccion se guarda la fila principal en Supabase y se crea el primer registro en `public.direction_inspection_history`.
- Al responder, cambiar estado, cerrar o reabrir una inspeccion se actualiza Supabase y se registra el evento en el historial remoto.
- La lista del modulo ya no depende de `localStorage` para inspecciones.
- Se mantiene el almacenamiento local/IndexedDB para evidencias fotograficas hasta integrar Supabase Storage.

## Sprint 5.6.2

Presupuesto como fuente unica en Supabase:

- El presupuesto maestro se carga desde `project_budget_items`.
- La version del presupuesto se carga desde `project_budget_versions`.
- `localStorage` ya no es fuente para presupuesto, cantidades, valores ni avance financiero.
- Si existe un presupuesto local previo y Supabase esta vacio, DAC intenta migrarlo una unica vez a Supabase.
- Registro Diario, edicion manual de avance, correcciones de cantidad y levantamiento inicial actualizan las cantidades ejecutadas del presupuesto remoto.
- Migracion requerida: `database/sprint-5-6-2-budget-supabase.sql`.

## Sprint 5.6.4

Correccion de sincronizacion posterior a importacion Excel:

- La importacion de presupuesto ahora espera a que Supabase inserte las actividades y recargue `project_budget_items`.
- El mensaje de exito solo aparece despues de actualizar el Store con el presupuesto leido desde Supabase.
- El encabezado, las tarjetas y la tabla del Presupuesto Maestro se alimentan del presupuesto remoto recargado.
- Se agregan diagnosticos en consola con actividades insertadas, actividades leidas y valor total calculado desde `project_budget_items`.
- Si Supabase devuelve un error, se muestra el detalle real y no se marca la importacion como exitosa.

## Sprint 5.6.5

Diagnostico tecnico de importacion de presupuesto:

- Antes de insertar, DAC registra en consola el `project_id`, usuario autenticado, rol de `current_profile_role()` y primer registro enviado a `project_budget_items`.
- La operacion registra por separado el resultado de `project_budget_versions` y `project_budget_items`.
- Los errores de Supabase se muestran con `code`, `message`, `details` y `hint` para identificar RLS, columnas, tipos de dato, nulos o conflictos.
- Si falla la insercion de actividades, la interfaz no muestra importacion exitosa.

## Sprint 5.6.6

Manejo de items duplicados al importar presupuesto:

- La validacion Excel detecta actividades con el mismo ITEM antes de insertar en Supabase.
- La pantalla muestra fila, item, descripcion, capitulo y subcapitulo de cada duplicado.
- La confirmacion queda bloqueada hasta resolver duplicados.
- La resolucion automatica conserva el ITEM original visible y usa `import_order` como diferenciador tecnico.
- Migracion requerida: `database/sprint-5-6-6-budget-duplicate-items.sql`.

## Sprint 5.4C.4

Usuario Juliana con rol Gestion Documental:

- Se agrega el rol `Gestion Documental` a la matriz de permisos.
- Juliana queda como usuaria activa con rol `Gestion Documental` en los datos base.
- El rol puede ver Dashboard, Documentos, Reportes, Presupuesto, Registro Diario, Bitacora e Inspecciones de Direccion.
- En Documentos puede cargar, clasificar, exportar e imprimir.
- En Presupuesto e Inspecciones se ocultan acciones criticas cuando el rol solo tiene consulta.
- Migracion opcional para perfil existente: `database/sprint-5-4c-4-juliana-gestion-documental.sql`.

## Correccion Gestion Documental

Carga real de documentos para Juliana:

- El modulo Documentos carga metadatos desde `project_documents`.
- Los archivos se suben al bucket privado `dac-project-documents` de Supabase Storage.
- El formulario de documentos usa archivo real y guarda nombre, carpeta, proyecto, usuario, fecha, observacion, tipo, tamano y ruta Storage.
- La descarga usa URL firmada temporal y respeta permiso `Documentos.Exportar`.
- La impresion respeta permiso `Documentos.Imprimir`.
- Migracion requerida: `database/sprint-5-4c-5-documents-storage.sql`.

## Sprint 5.7

Registro Diario y Reportes Diarios compartidos por proyecto:

- El Registro Diario deja de depender del navegador local para ser visible entre usuarios.
- Los reportes se guardan y consultan desde Supabase por `project_id`.
- Se agregan tablas remotas para `daily_reports`, `report_activities`, `report_photos` y `commitments`.
- El guardado usa la funcion transaccional `save_daily_report_bundle(payload)` para registrar reporte, actividades, fotografias y compromisos juntos.
- La consola informa proyecto consultado, usuario autenticado, consulta ejecutada, origen de datos y cantidades encontradas.
- Migracion requerida: `database/sprint-5-7-daily-reports-supabase.sql`.

## Sprint 5.7.1

Correccion de guardado infinito en Registro Diario:

- El boton ya no queda indefinidamente en `Guardando...`.
- La lectura de fotografias desde IndexedDB tiene timeout.
- La llamada a `save_daily_report_bundle(payload)` tiene timeout.
- Si Supabase falla, DAC muestra `code`, `message`, `details` y `hint`.
- Si guarda correctamente, DAC recarga los reportes desde Supabase por `project_id`.
- Las fotografias con `image_data` demasiado grande no bloquean el guardado; se registra el metadato y se deja trazabilidad en consola.

## Sprint 5.7.2

Correccion de excepcion frontend posterior al guardado:

- `localStorage` queda protegido para no generar pantalla blanca si supera cuota en celular.
- DAC ya no persiste `image_data` en la copia local del Store.
- La lectura de fotografias en Registro Diario, Modo Obra y Reporte Diario queda envuelta en `try/catch`.
- Los errores controlados registran stack, archivo, funcion y mensaje original en consola.
- Si ocurre una falla posterior al guardado, la interfaz mantiene un mensaje amigable y no queda en blanco.

## Sprint 5.7.3

Registro Diario listo para produccion:

- El guardado exitoso muestra `Registro Diario guardado correctamente.`.
- Los reportes diarios se consultan exclusivamente desde Supabase por `project_id`.
- El Store ya no hidrata actividades, reportes, fotos ni compromisos del Registro Diario desde `localStorage`.
- Si Supabase no tiene datos reales, la pantalla queda vacia.
- Un nuevo Registro Diario inicia sin fotos, actividades, compromisos ni observaciones del reporte anterior.
- Se separa el borrador actual usando registros sin `dailyReportId`.
- El boton `Reiniciar datos de prueba` solo esta disponible para rol `Administrador` y la accion queda protegida en el Store.

