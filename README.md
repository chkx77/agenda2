# Agenda Pro

Aplicación para administrar disponibilidad y turnos. El propietario inicia sesión y comparte `/turno/{UID}` con sus clientes.

## Tecnologías
React 18, Vite, Firebase Authentication, Firestore y Cloud Functions.

## Estado
Actualización de privacidad y reservas preparada para un despliegue coordinado. La interfaz nueva requiere Cloud Functions y App Check configurados; subir el código a GitHub por sí solo no activa el servicio.

## Diseño y privacidad
- `propietarios/{UID}`: contiene únicamente configuración pública.
- `turnos`: documentos privados; solo el propietario puede leerlos.
- `ocupados`: publica solo fecha, hora y duración, sin nombres, teléfonos ni códigos.
- `locks`: coordinación interna por fecha.
- Reservar, modificar, cancelar y eliminar usan funciones del servidor.
- El servidor valida disponibilidad, fechas, bloqueos y solapamientos en una transacción.
- El código de cancelación se genera con aleatoriedad criptográfica y se devuelve una sola vez al cliente. Se guarda su hash, no el código.

## Desarrollo
Node.js 22, npm, Firebase CLI y Java para el emulador de Firestore.

```sh
npm install
npm --prefix functions install
npm test
npm run dev
npm run build
```

La configuración web existente está en `src/firebase.js`. Para otro proyecto, reemplazar sus valores por la configuración web de ese proyecto. No usar claves Admin en el frontend.

## Activación
1. Trabajar primero sobre un proyecto de pruebas con datos ficticios.
2. Activar Authentication email/contraseña y Firestore.
3. Registrar la aplicación web en Firebase App Check con reCAPTCHA v3 y su dominio. Copiar la clave pública a `VITE_APP_CHECK_SITE_KEY` en el entorno de Vercel.
4. Verificar requisitos y facturación del proyecto para Cloud Functions. No se habilita facturación automáticamente.
5. Desde un entorno autenticado con Firebase CLI, desplegar las funciones y las reglas de este repositorio en el proyecto elegido.
6. Compilar/desplegar la interfaz con la variable de App Check.
7. Probar reserva, cancelación con código, sesión del propietario y dos reservas simultáneas del mismo horario.

Las funciones se despliegan en `us-central1`; cliente y servidor deben coincidir. La validación pública de fechas usa America/Argentina/Buenos_Aires.

## Migración de una instalación existente
No aplicar esta actualización directamente sobre datos reales sin respaldo. El esquema previo puede guardar códigos en claro y no tiene ocupados. La migración necesita generar códigos nuevos, guardarlos como hash y producir documentos públicos de disponibilidad, preservando los turnos privados. Los nuevos códigos deben entregarse a sus titulares por un canal autorizado. Los códigos anteriores no son compatibles. Revisar también configuración antigua y eliminar datos privados del documento público raíz.

## Límites
Pruebas locales de dominio no reemplazan pruebas de integración con los emuladores ni una validación de App Check en el dominio publicado. Cambiar la duración/horarios después de crear turnos requiere revisar los turnos existentes. No se verificó una implementación en clientes.

## Soporte
Si aparece un error de App Check, revisar clave pública, dominio y registro de la aplicación. Si el horario se ocupó mientras completabas el formulario, volver a consultar disponibilidad. No abrir la colección privada para resolver problemas de permisos.

## Presentación profesional
Proyecto personal o académico de Matías Romero. El código y la documentación describen su alcance; no se atribuyen clientes, métricas ni experiencia de producción no verificados.

## Comprobaciones
El workflow de GitHub Actions instala dependencias y compila el proyecto. El resultado del workflow, y no la existencia de este apartado, determina si la verificación pasó.

## Datos para demostraciones
Usar datos ficticios. No subir bases de datos, contraseñas, claves de servicio ni exportaciones con datos personales.
