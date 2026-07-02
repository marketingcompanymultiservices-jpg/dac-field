# Sprint Branding 01 - Identidad corporativa oficial

## Objetivo

Integrar la identidad visual oficial de Doble Altura Construcciones en DAC - Doble Altura Control, sin modificar funcionalidades ni datos operativos.

## Activos agregados

- Logo oficial: `public/branding/logo.png`
- Favicon basado en isotipo: `public/favicon.png`
- Copia del favicon en branding: `public/branding/favicon.png`

## Componentes creados

### `components/AppLogo.tsx`

Componente unico para mostrar el logo institucional.

Comportamiento:

- Intenta cargar `/branding/logo.svg`.
- Si no existe, usa `/branding/logo.png`.
- Si ningun archivo carga, muestra el placeholder `DA`.

### `components/AppBrand.tsx`

Componente de marca para encabezados y pantallas principales.

En escritorio muestra:

- Logo
- Doble Altura Control
- Sistema Integral de Gestion de Obras
- Lema cuando la pantalla lo requiere

En celular muestra:

- Logo
- DAC

## Integraciones realizadas

- Login.
- Header general.
- Dashboard y modulos que usan el layout general.
- Centro de Control.
- Reporte Diario Real.
- Vista de impresion del reporte diario.
- Metadata de Next.js.
- Favicon del navegador.

## Metadata

Titulo:

`DAC | Doble Altura Control`

Descripcion:

`Sistema Integral de Gestion de Obras de Doble Altura Construcciones S.A.S.`

## Criterios visuales

La marca se conserva sobre la paleta corporativa:

- Azul principal: `#004C6D`
- Azul secundario: `#00B2D7`
- Naranja: `#D78C37`
- Negro: `#131413`
- Fondo: blanco

En fondos oscuros, el logo se presenta sobre una base blanca para preservar contraste y legibilidad.

## Restricciones respetadas

- No se modificaron funcionalidades.
- No se modifico Store Global.
- No se modifico Presupuesto.
- No se modifico la navegacion funcional.
- No se agrego backend.
