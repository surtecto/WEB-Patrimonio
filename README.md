# Registro del Patrimonio Cultural · San Andrés de Giles

Sitio web estático del **Registro Oficial del Patrimonio Cultural de San Andrés de Giles (PCSAG)** — Ord. 2182/19, mod. Ord. 2446/21. Comisión Municipal Asesora de Patrimonio Cultural (CMAPCSAG).

- **Mapa**: bienes declarados (KML de lugares declarados + parcelas vinculadas) sobre imagen satelital Esri, con capas encendibles de **Parcelario 2024 (COU)** y **Mensuras históricas del AHGBA** (mensuras, caminos, estancias/puestos/postas).
- **Fichas**: una ficha patrimonial por cada asiento del Registro Oficial (103 bienes con ordenanza) y por cada asiento sin ordenanza (12), con reseña investigada, datos clave, instrumento, catastro, fotografías y fuentes. Se pueden imprimir.
- **Normativa**: régimen y ordenanzas declaratorias con el número de asientos de cada una.
- **Localizar**: los bienes que el instrumento no permite ubicar se localizan desde el propio mapa.

## Publicar en GitHub Pages

1. Crear un repositorio (por ejemplo `patrimonio-sag`) y subir **todo el contenido de esta carpeta** a la raíz (incluido `.nojekyll`).
2. En *Settings → Pages*, elegir *Deploy from a branch*, rama `main`, carpeta `/ (root)`.
3. El sitio queda en `https://<usuario>.github.io/patrimonio-sag/`.

> Abrir `index.html` con doble clic no funciona (los navegadores bloquean la lectura de los datos desde `file://`). Para probar localmente: `python -m http.server` dentro de la carpeta y abrir `http://localhost:8000`.

## Flujo de localización

1. En el mapa o en una ficha: **Localizar este bien**.
2. Marcar el punto (clic, arrastrable), elegir una parcela con el Parcelario encendido, buscar una dirección, o escribir una nomenclatura (`I-A-95-2`) en el buscador.
3. Las propuestas se guardan en el navegador. **Exportar GeoJSON** descarga `localizaciones.json`.
4. Reemplazar `data/localizaciones.json` en el repositorio por el archivo exportado: la localización queda publicada para todos (estado «Localización incorporada»).

## Estructura

```
index.html            página única (rutas con #/)
css/styles.css        estilos (tema claro/oscuro, impresión de fichas)
js/app.js             aplicación
vendor/leaflet/       Leaflet 1.9.4 (local, sin depender de CDN)
data/registro.json    115 asientos: registro + investigación + geometría
data/declarados_kml.geojson  KML original convertido, con los ID vinculados
data/parcelario.geojson      Parcelario SAG 2024 (EPSG:22185 → WGS84)
data/mensuras.geojson / caminos.geojson / estancias.geojson   AHGBA
data/localizaciones.json     localizaciones incorporadas por la Comisión
img/                  fotografías del archivo de la CMAPCSAG
```

## Datos y privacidad

El parcelario se publica **sin nombres de titulares ni domicilios**: sólo nomenclatura, partida, zona COU y superficie. La nomenclatura catastral tomada de la planilla 2024 (no del texto de la ordenanza) se dibuja con borde punteado y debe cotejarse con ARBA antes de dar fe registral.

Para actualizar el registro, editar `data/registro.json` (cada bien tiene `res` = reseña, `datos`, `fuentes`, `fotos`, `g` = geometría GeoJSON).
