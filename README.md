# Registro del Patrimonio Cultural · San Andrés de Giles

Sitio web estático del **Registro Oficial del Patrimonio Cultural de San Andrés de Giles (PCSAG)** — Ord. 2182/19, mod. Ord. 2446/21. Comisión Municipal Asesora de Patrimonio Cultural (CMAPCSAG).

- **Mapa interactivo**: bienes declarados (KML de lugares declarados + parcelas vinculadas) sobre imagen satelital Esri y callejero OSM, con capas encendibles de **Parcelario 2024 (COU)** y **Mensuras históricas del AHGBA** (mensuras 1830–1925, caminos antiguos, estancias/puestos/postas).
- **Herramientas GIS en mapa**: geolocalización GPS móvil en tiempo real («Mi ubicación») con detección del bien más cercano, regla interactiva para medir distancias y áreas, y exportación directa de capas filtradas a **GeoJSON** y **KML**.
- **Fichas patrimoniales**: catálogo exhaustivo con 103 bienes con ordenanza y 12 asientos sin ordenanza. Reseña histórica, datos clave, instrumento, catastro parcelario, fotografías y fuentes. Incluye filtros facetados (por localidad, categoría, tipo, estado registral y época), botón para compartir enlace y navegación directa («Cómo llegar con GPS»).
- **Itinerarios temáticos**: circuitos patrimoniales autoguiados (Casco Histórico Fundacional, Postas y Camino Real, Pueblos Rurales y Estaciones, Memoria Cívica y Monumentos) y generador personalizado a medida (a pie, en bicicleta o vehículo) con trazado de ruta en el mapa y navegación paso a paso.
- **Calendario y fiestas**: cronograma anual de festividades patronales, fiestas populares gastronómicas (Fiesta Provincial de la Galleta de Campo en Azcuénaga, Fiesta del Hornero en Cucullú, Fiesta del Camino Real en Villa Ruiz), vigilias de patrimonio inmaterial (Fogón Criollo de Malvinas) y efemérides históricas, con exportación de eventos a calendarios (.ics).
- **Normativa**: régimen orgánico y ordenanzas declaratorias del H.C.D. con el desglose de asientos y expedientes.
- **Localización colaborativa**: herramienta interactiva para que la Comisión y la comunidad propongan la ubicación de bienes pendientes sobre el parcelario o imagen satelital, con exportación a GeoJSON.
- **PWA y soporte móvil**: barra de navegación inferior táctil para smartphones, `manifest.json` y Service Worker (`sw.js`) para consulta offline en áreas rurales del partido con baja cobertura.

## Publicar en GitHub Pages

1. Subir **todo el contenido de esta carpeta** a la raíz del repositorio de GitHub (incluido `.nojekyll` y `manifest.json`).
2. En *Settings → Pages*, seleccionar *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. El sitio queda activo en `https://<usuario>.github.io/<repositorio>/`.

> Para probar localmente: ejecutar `python3 -m http.server 8000` en esta carpeta y abrir `http://localhost:8000`.

## Estructura de archivos

```
index.html                  Página única (SPA con hash router #/)
manifest.json               Configuración PWA (instalable en móviles)
sw.js                       Service Worker para soporte offline
css/styles.css              Estilos (tema claro/oscuro, móvil y print)
js/app.js                   Lógica de la aplicación, mapas, itinerarios y agenda
vendor/leaflet/             Leaflet 1.9.4 local (sin dependencias CDN)
data/registro.json          115 asientos: registro + investigación + geometría
data/declarados_kml.geojson Polígonos y puntos declarados
data/parcelario.geojson     Parcelario SAG 2024 (ARBA/COU)
data/mensuras.geojson       Mensuras históricas 1830-1925 (AHGBA)
data/caminos.geojson        Trazas y caminos de las mensuras
data/estancias.geojson      Postas, pulperías y puestos históricos
data/localizaciones.json    Localizaciones aprobadas por la Comisión
img/                        Fotografías del archivo de la CMAPCSAG
```
