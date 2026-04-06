---
name: meta-ads-monthly-report
description: Genera reportes PDF premium mensuales para clientes de Meta Ads con hojas de membrete DT Growth Partners. Usar cuando el usuario pida crear un informe/reporte mensual de ads, resultados de publicidad, o reporte para cliente de Facebook/Instagram Ads. Procesa CSVs de Meta Ads Manager, genera PDFs con diseño profesional usando membrete azul en portada y membrete blanco en páginas de contenido. Incluye header con logo + nombre del cliente, footer con contexto confidencial y paginación, líneas de marca azul (#105F9A).
---

# Meta Ads Monthly Report Generator v4.0

## INSTRUCCIÓN PRINCIPAL — NO ESCRIBIR CÓDIGO NUEVO

El script `scripts/generate_report.py` ya está listo y funcional. NO escribir código nuevo. Seguir estos pasos exactos:

### Paso 1: Instalar dependencias
```bash
pip install reportlab pandas pillow --break-system-packages
```

### Paso 2: Copiar el script de referencia
```bash
cp /mnt/skills/user/meta-ads-monthly-report/scripts/generate_report.py /home/claude/generate_report.py
```

### Paso 3: Cambiar SOLO estas 4 variables al inicio del script (líneas 461-464)
```python
CLIENT_NAME = "Nombre del Cliente"    # Cambiar por el nombre real
MONTH = "Marzo"                        # Cambiar por el mes real
YEAR = "2026"                          # Cambiar por el año real
CSV_PATH = "/mnt/user-data/uploads/archivo.csv"  # Cambiar por la ruta real del CSV
```

### Paso 4: Ejecutar
```bash
cd /home/claude && python3 generate_report.py
```

### Paso 5: Presentar el archivo generado
El PDF se genera automáticamente en `/mnt/user-data/outputs/` con nomenclatura `Informe_MetaAds_{Cliente}_{Mes}_{Año}.pdf`

## IMPORTANTE: NO hacer ninguna de estas cosas
- NO escribir un script nuevo desde cero
- NO agregar logo en la portada (el membrete ya lo tiene)
- NO usar emojis (Helvetica no los soporta)
- NO usar color #17639C ni #1B4D6E (el azul corporativo es #105F9A)
- NO usar teal/verde #2D8A9B para contacto
- NO usar fuentes menores a 10pt (el cliente lee en teléfono)
- NO escribir recomendaciones internas como "escalar campaña X" — deben ser para el CLIENTE

## Si necesitas personalizar insights o recomendaciones

Después de copiar el script, puedes editar las secciones de insights (alrededor de línea 700) y recomendaciones (alrededor de línea 730) usando str_replace. El resto del script NO debe modificarse.

## Flujo conversacional

1. Si el usuario sube un CSV → copiar script, cambiar variables, ejecutar
2. Si el usuario pide el reporte sin CSV → pedir que suba el CSV exportado de Meta Ads Manager
3. Si el usuario quiere insights/recomendaciones custom → aplicar con str_replace después de copiar

## Referencia técnica (NO usar para escribir código nuevo, solo para entender el script)

### Colores corporativos
- Azul: #105F9A | Azul oscuro: #0D4F82 | Gris: #6B7B8D
- Pastel: rojo #FFEAE6, amarillo #FFF1CC, verde #DAF2C2, azul #CFE9FE

### Estructura: 5 páginas
1. Portada (membrete azul, SIN logo extra)
2. Resumen ejecutivo (métricas pastel + narrativa)
3. Rendimiento por campaña (tabla tipo→gasto) + Resultados de negocio
4. Insights (cards pastel) + Recomendaciones (bloque amarillo, para CLIENTE)
5. Cierre

### Fuentes (optimizadas para teléfono)
Títulos 19pt, valores 22pt, labels 10pt, tablas 10-11pt, cuerpo 12pt, insights 11-13pt

### Assets
```
assets/brand/membrete_portada.jpeg   # FONDO portada — YA TIENE LOGO, NO AGREGAR OTRO
assets/brand/membrete_contenido.jpeg # FONDO contenido — YA TIENE LOGO
assets/brand/logo_portada.jpeg       # NO USAR EN PORTADA
```
