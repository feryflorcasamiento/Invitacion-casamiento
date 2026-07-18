# Invitación definitiva · Fernando & Florencia

## Archivos
Subí a GitHub:
- `index.html`
- `apps-script.gs`
- `README.md`
- las fotografías, acuarelas y el archivo de música incluidos en este ZIP

Vercel publicará la actualización automáticamente.

## Estructura exacta de Google Sheets
La fila 1 debe contener:

`ID | Invitado 1 | Invitado 2 | Invitado 3 | Invitado 4 | Asiste 1 | Asiste 2 | Asiste 3 | Asiste 4 | Total | Canción | Restricciones | Fecha | Estado`

## Conectar la invitación con Google Sheets
1. En Google Sheets abrí `Extensiones > Apps Script`.
2. Borrá lo que aparezca.
3. Pegá el contenido de `apps-script.gs`.
4. Verificá que la pestaña de la planilla se llame `Hoja 1`.
5. Tocá `Implementar > Nueva implementación`.
6. Tipo: `Aplicación web`.
7. Ejecutar como: `Yo`.
8. Quién tiene acceso: `Cualquier persona`.
9. Tocá `Implementar`.
10. Copiá la URL que termina en `/exec`.
11. En GitHub abrí `script.js`.
12. Reemplazá `PEGAR_URL_DE_APPS_SCRIPT_AQUI` por esa URL.
13. Guardá con `Commit changes`.

## Enlaces personalizados
Ejemplo:

`https://TU-SITIO.vercel.app/?id=001`

El código `001` corresponde a la fila con ID `001` en Google Sheets.

## Funcionamiento
Al confirmar:
- se actualiza Google Sheets;
- se envía un correo a `feryflorcasamiento@gmail.com`;
- aparecen dos botones para enviar el mensaje por WhatsApp a Florencia o Fernando.
