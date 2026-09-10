# Plan & Prueba

Aplicación web en español para preparar el **plan y registro de prueba de fuga y/o estanqueidad de sistemas integrados**, basada en los campos del formato FR-6.3.2.9 proporcionado. La presentación del PDF está rediseñada en A4 vertical; no es una reproducción gráfica exacta del original.

## Abrir en VS Code

1. Abre esta carpeta en VS Code: **Archivo → Abrir carpeta**.
2. Instala Node.js 22.12 o posterior (Node.js 24 recomendado).
3. En la terminal integrada ejecuta:

```sh
npm ci
npm run dev
```

Abre la dirección que aparece en la terminal. No abras `index.html` con doble clic: la aplicación utiliza módulos y necesita el servidor local.

## Uso

1. Completa los datos generales, compartidos entre ambas hojas.
2. Carga o arrastra una imagen JPG, PNG o WebP de hasta 10 MB. Prepara la imagen con las conexiones enumeradas; la app no incorpora un editor de diagramas. La imagen se ajusta sin deformarse y se reutiliza en el plan y el registro.
3. Introduce las condiciones y el procedimiento del plan.
4. Registra las condiciones reales, los resultados de las 35 conexiones, correcciones, equipos y responsables.
5. Completa el control documental de la prueba. La elaboración, revisión y aprobación del formato son de solo lectura: LIS / Angell Pacheco / 23.04.2025; JAR / Luz Fuentes / 30.04.2025; GC / Paul Helden / 30.04.2025. Las tres filas conservan «Autorizado» en Firma, según el PDF original. Se restauran también al abrir borradores y copias anteriores.
6. Pulsa **Exportar PDF** y elige el documento completo, solo el plan o solo el registro. El botón de ampliar la vista previa abre el PDF exacto antes de descargarlo.

El panel lateral muestra un resumen visual. El PDF completo incluye todas las tablas, instrucciones y notas. Un documento habitual ocupa dos hojas; los textos extensos y las filas adicionales continúan automáticamente en páginas nuevas. Los campos pendientes se muestran con una raya y pueden exportarse como plantilla.

**Guardar copia** descarga un archivo JSON editable, incluyendo la imagen. **Abrir** recupera esa copia. El borrador se guarda automáticamente en `localStorage` de este navegador. No existe servidor, cuenta, sincronización entre equipos ni firma electrónica. Limpiar los datos del navegador elimina su borrador; usa copias JSON para conservar documentos. Los datos y las imágenes se procesan localmente. Las fuentes tipográficas se solicitan a Google Fonts; si no hay conexión se usan las fuentes del sistema.

## Preparar y publicar

```sh
npm test
npm run build
npm run preview
```

La carpeta `dist/` contiene la web estática lista para desplegar. No necesita claves, base de datos ni servicios de pago. `base: './'` permite alojarla en un subdirectorio, como un repositorio de GitHub Pages.

### GitHub Pages

1. Crea un repositorio vacío en tu cuenta de GitHub.
2. Desde **Control de código fuente** de VS Code, confirma los archivos y publica el repositorio; también puedes añadir el remoto y subir tu rama desde la terminal.
3. En GitHub, abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**.
4. En **Actions**, ejecuta **Deploy to GitHub Pages**, o sube cambios a `main`. El flujo incluido instala con `npm ci`, prueba, compila y publica `dist/`.

Si tu rama principal tiene otro nombre, cambia `branches: [main]` en `.github/workflows/deploy.yml`. La web será accesible según la configuración de GitHub Pages de tu repositorio. Los documentos no se suben al repositorio ni al alojamiento: cada usuario trabaja en su propio navegador.

### Otros alojamientos estáticos

En un alojamiento que compile desde GitHub, configura `npm run build` como comando y `dist` como carpeta de publicación. Para una carga manual, sube el contenido de `dist/`. No se requiere reescritura de rutas.

## Estructura

```text
src/app.js          Interfaz, carga de imagen, borrador y copias JSON
src/style.css       Diseño adaptable a escritorio y móvil
src/model.js        Modelo y validación de los documentos
src/pdf.js          Composición del PDF, tablas y paginación
public/favicon.svg Identidad de la aplicación
tests/             Pruebas de datos y generación de PDF
.github/workflows/ Publicación opcional desde GitHub
```

JavaScript modular, Vite, jsPDF, jsPDF-AutoTable y Lucide. `npm test` genera PDF de verificación en `tmp/pdfs/`, excluidos de Git. El formato utiliza Helvetica para PDF y admite los caracteres españoles habituales; para otros alfabetos sería necesario incorporar una fuente Unicode al generador.

El contenido original se utilizó como referencia de campos. Las aprobaciones del formato conservan los datos originales y no representan la aprobación del resultado de una prueba. No se precargan parámetros técnicos como resultados reales. La aplicación prepara documentación; no ejecuta ni valida una prueba física.

La aplicación incluye integración opcional con `document.modelContext` para leer el borrador y actualizar campos. Los navegadores sin esa API siguen funcionando normalmente. Esta integración no se verificó en un navegador con WebMCP; la compilación y las pruebas de datos/PDF sí se verificaron. No se realizaron pruebas automatizadas de interacción en navegador.
