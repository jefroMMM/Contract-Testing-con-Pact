# Guion opcional de exposición (3 minutos)

**Responsable:** Jefry Ariel Mas Monterroso.

**Institución:** Universidad Mariano Gálvez de Guatemala.

**Tema:** Compatibilidad entre consumidor y proveedor mediante Pact.

No se requiere grabar ni entregar video. Este guion sirve para una explicación presencial o demostración voluntaria. Antes de comenzar, abre la raíz del repositorio en el editor, ejecuta `npm ci` y deja generados el contrato y las evidencias con `npm run demo`. Los tiempos son orientativos; si el verificador tarda, muestra la evidencia guardada mientras termina.

## 0:00 a 0:25 - Presentar el problema

**Qué decir:** “Este proyecto comprueba que una aplicación que consulta productos puede seguir entendiendo las respuestas de una API. Aunque ambas partes funcionen por separado, un cambio en la respuesta puede romper su comunicación. Pact permite detectar esa diferencia antes de entregar el sistema.”

**Qué abrir:** `README.md`, descripción inicial y diagrama de arquitectura.

**Qué mostrar:** Consumidor, proveedor, contrato JSON y verificador. Explicar que todo se ejecuta localmente y no necesita servicios de pago.

## 0:25 a 0:50 - Explicar las dos interacciones

**Qué decir:** “Probé dos situaciones. Cuando existe el producto, espero un identificador, nombre, precio numérico y disponibilidad. Cuando no existe, espero un 404 con un código de error conocido. El consumidor diferencia este caso de una falla de red o un error del servidor.”

**Qué abrir:** `src/product-client.ts` y la tabla de interacciones del README.

**Qué mostrar:** Los resultados `found` y `not-found`, y el código `PRODUCT_NOT_FOUND`.

## 0:50 a 1:20 - Generar el contrato desde el consumidor

**Qué decir:** “Las pruebas usan el mismo cliente HTTP de la aplicación. Lo conecto al servidor simulado de Pact, defino las respuestas esperadas y verifico cómo las interpreta. Pact genera el contrato automáticamente; no lo escribí a mano.”

**Qué abrir:** `tests/consumer.pact.test.ts`.

**Qué ejecutar:**

```sh
npm run test:consumer
```

**Qué resultado mostrar:** Dos pruebas aprobadas. Abrir `pacts/ProductConsumer-ProductProvider.json` y señalar las dos interacciones y el matcher de `price`.

## 1:20 a 1:45 - Verificar la API real

**Qué decir:** “Ahora Pact lee ese mismo contrato y envía las solicitudes a la API real. Antes de cada interacción, preparo todos los datos necesarios. Un estado crea el producto y el otro deja el catálogo vacío; ninguno depende de la prueba anterior.”

**Qué abrir:** `tests/verify-provider.ts`, especialmente `stateHandlers`.

**Qué ejecutar:**

```sh
npm run test:provider
```

**Qué resultado mostrar:** Las dos interacciones verificadas y el mensaje `VERIFICACION EXITOSA`.

## 1:45 a 2:20 - Demostrar la incompatibilidad

**Qué decir:** “Voy a activar un cambio controlado en el proveedor: devolver el precio como texto. El contrato sigue esperando un número. No cambio el contrato para fabricar el error.”

**Qué abrir:** La opción `incompatiblePrice` en `src/provider.ts`.

**Qué ejecutar:**

```sh
npm run test:provider:incompatible
```

**Qué resultado mostrar:** El proceso falla y Pact identifica el precio de tipo incorrecto en `$.price`. Mostrar también el registro completo correspondiente en `evidencias/`. Explicar: “Este fallo es el resultado esperado de la demostración: Pact detectó una incompatibilidad real. No significa que la entrega final quede rota.”

## 2:20 a 2:45 - Restaurar y comprobar

**Qué decir:** “La opción incompatible solo está activa en ese proceso. Al ejecutar la verificación normal, el precio vuelve a ser numérico y se conserva el contrato original.”

**Qué ejecutar:**

```sh
npm run test:provider
```

**Qué resultado mostrar:** Verificación exitosa después de corregir el cambio. Señalar que `npm test` ejecuta todas las comprobaciones normales y termina con el proveedor compatible.

## 2:45 a 3:00 - Cerrar la exposición

**Qué decir:** “La entrega incluye el código TypeScript, el contrato generado, las cuatro evidencias y el informe PDF. El ciclo demuestra que las dos partes son compatibles, que un cambio de tipo se detecta y que la versión final queda corregida. Pact ayuda a comprobar este acuerdo entre servicios, aunque todavía se necesitan otras pruebas para cubrir todas las reglas de negocio.”

**Qué abrir:** `output/pdf/informe-contract-testing.pdf` y el repositorio en la etiqueta `entrega-v1.0.0`.

**Qué mostrar:** Las cuatro evidencias y el enlace a la versión identificada de la entrega.
