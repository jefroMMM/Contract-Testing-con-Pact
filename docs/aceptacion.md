# Verificación de entrega

Responsable: Jefry Ariel Mas Monterroso. Universidad Mariano Gálvez de Guatemala.

Versión: `entrega-v1.0.0`. Fecha: 29 de octubre de 2026, America/Guatemala.

- [x] Proyecto TypeScript con comprobación estricta de tipos.
- [x] API proveedora y consumidor HTTP reutilizable funcionales.
- [x] Dos interacciones: producto existente e inexistente.
- [x] Pruebas contractuales con el cliente real contra Pact.
- [x] Contrato JSON generado automáticamente e incluido en Git.
- [x] Estados del proveedor que reemplazan todos los datos y no dependen del orden.
- [x] Verificación inicial real exitosa.
- [x] Incompatibilidad real detectada en `$.price` por cambio de decimal a texto.
- [x] Contrato sin cambios durante la demostración (SHA-256 idéntico).
- [x] Compatibilidad restaurada y verificación final exitosa.
- [x] Cuatro capturas auténticas del visor de registros originales, identificadas como tales.
- [x] Registros stdout/stderr y metadatos de ejecución preservados.
- [x] README reproducible, diagramas Mermaid/SVG y fuente editable del informe.
- [x] Informe PDF de nueve páginas, renderizado y revisado visualmente.
- [x] Guion opcional de exposición de tres minutos; no se requiere video.
- [x] Instalación limpia con `npm ci` y auditoría npm sin vulnerabilidades reportadas.
- [x] Revisión de archivos entregables sin credenciales ni claves privadas detectadas.

## Comprobaciones ejecutadas

`npm test` terminó con código 0: TypeScript, cinco pruebas complementarias, dos pruebas del consumidor, las dos interacciones verificadas en el proveedor y smoke de los ejecutables API/CLI. Las consultas reales mostraron el teclado por Q249.90 y el mensaje de producto inexistente.

`npm run demo` terminó con código 0 después de comprobar la secuencia de salidas de sus procesos: **0, 0, 1, 0**. El fallo intermedio es obligatorio y proviene de Pact: `Expected '249.9' (String) to be a decimal number`. La interacción 404 permaneció compatible.

`npm run evidence:capture -- --edge` generó las cuatro capturas desde los registros originales y comprobó sus hashes. `npm run report` generó el PDF y validó su texto y paginación. Las imágenes del PDF se revisaron después de renderizarlo con Poppler.

Los resultados originales están en [evidencias](../evidencias/), especialmente [resumen.json](../evidencias/resumen.json), [pruebas finales](../evidencias/05-pruebas-finales.log) y [demostración completa](../evidencias/06-demostracion-completa.log).

## Entrega en Canvas

El informe se generó localmente. Falta únicamente que el responsable cargue [el PDF](../output/pdf/informe-contract-testing.pdf) en Canvas de la universidad. No se accedió al aula ni se afirmó haber realizado ese envío.

## Identificación en Git

Repositorio: https://github.com/jefroMMM/Contract-Testing-con-Pact

Referencia final: `entrega-v1.0.0`. Para consultar el commit exacto después de obtener las etiquetas:

```sh
git fetch --tags
git rev-parse 'entrega-v1.0.0^{commit}'
```
