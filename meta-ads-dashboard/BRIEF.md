# Meta Suite - Documentacion del Proyecto

## Descripcion General

**Meta Suite** es una aplicacion web para crear y gestionar campanas publicitarias en Facebook e Instagram a traves de la API de Meta Marketing. Integra generacion de contenido con Inteligencia Artificial (OpenAI), analisis automatico de videos/imagenes, y plantillas de campanas preconfiguradas optimizadas para el mercado colombiano.

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Frontend | React | 19.2.0 |
| Bundler | Vite | 7.2.4 |
| HTTP Client | Axios | 1.13.2 |
| Backend | Express (Node.js) | 4.18.2 |
| IA | OpenAI (GPT-4o-mini + Whisper) | 6.18.0 |
| Video | FFmpeg + fluent-ffmpeg | 5.3.0 / 2.1.3 |
| Uploads | Multer | 2.0.2 |
| API Externa | Meta Marketing API | v18.0 |

---

## Arquitectura del Proyecto

```
meta-ads-dashboard/
├── src/                              # Frontend React
│   ├── App.jsx                       # App principal + Login con Facebook
│   ├── App.css                       # Estilos globales
│   ├── components/
│   │   ├── CampaignDashboard.jsx     # Dashboard de campanas activas
│   │   └── CreativeBuilder.jsx       # Constructor de campanas con IA
│   ├── services/
│   │   └── metaAdsApi.js             # Servicio de integracion con Meta API
│   └── config/
│       └── campaignTemplates.js      # 7 plantillas de campanas
├── server/
│   ├── index.js                      # Backend API (Express)
│   └── package.json                  # Dependencias del servidor
├── index.html                        # Entry point con Facebook SDK
├── vite.config.js                    # Configuracion de Vite
├── .env.development                  # Variables de entorno
└── package.json                      # Dependencias del frontend
```

---

## Instalacion y Ejecucion

### Requisitos Previos
- Node.js v18 o superior
- Cuenta de desarrollador en Meta (Facebook)
- Access Token de Meta con permisos: `ads_management`, `pages_show_list`, `business_management`, `pages_read_engagement`, `ads_read`

### 1. Instalar dependencias del frontend

```bash
cd meta-ads-dashboard
npm install
```

### 2. Instalar dependencias del backend

```bash
cd meta-ads-dashboard/server
npm install
```

### 3. Configurar variables de entorno

El archivo `.env.development` contiene:

```env
VITE_API_URL=http://localhost:3002/api
```

Para produccion, cambiar a la URL del servidor desplegado.

### 4. Ejecutar el proyecto

**Terminal 1 - Backend (puerto 3002):**
```bash
cd meta-ads-dashboard
npm run server
```

**Terminal 2 - Frontend (puerto 5173):**
```bash
cd meta-ads-dashboard
npm run dev
```

### 5. Acceder

Abrir `http://localhost:5173` en el navegador.

---

## Flujo de Uso

### Paso 1: Autenticacion

Al abrir la app se muestra la pantalla de login con dos opciones:

1. **Continuar con Facebook** - Login OAuth con Facebook SDK. Requiere que la app de Facebook este activa o que el usuario sea tester/developer de la app.
2. **Usar Access Token manualmente** - Pegar un token generado en [Graph API Explorer](https://developers.facebook.com/tools/explorer/) con los permisos necesarios.

TOKEN: EAALFI7ZB5B9MBQroyBzxpZCK3w9ZA7YriVbloDhjip5qiNFQS2ZBwAADKLLrFYzvJWBLSzHCNTEWDzLZCe6PaP0VqereQNnqiSp9RtQbOJJBv022jZB5zjCseaP3llP0lSuVXSxTVyjLsHIufH2JaM1ls34wBHKv2r1IZBRHM5TWKGUTrabkGWanU6uA6k6IXen4eV9vO04XMlKEfbBOf7ED0FcRuF38ubr

El token se guarda en `localStorage` y persiste entre sesiones hasta que expire o se cierre sesion.

### Paso 2: Navegacion Principal

La app tiene dos secciones principales accesibles desde la barra de navegacion:

- **Dashboard** - Visualizacion y monitoreo de campanas activas
- **Creative Builder** - Creacion de nuevas campanas con IA

---

## Dashboard de Campanas

Muestra las campanas activas y pausadas con metricas en tiempo real:

- Estado de la campana (Activa/Pausada)
- Gasto del dia y presupuesto restante
- Alcance e impresiones
- Costo por resultado (segun objetivo)
- Actualizacion automatica cada 30 segundos

---

## Creative Builder - Creacion de Campanas

### Paso 1: Seleccion de Plantilla

Se ofrecen **7 plantillas** organizadas en 4 categorias:

#### Trafico
| Plantilla | Objetivo | Optimizacion | Presupuesto Sugerido |
|-----------|----------|-------------|---------------------|
| Trafico a Sitio Web | OUTCOME_TRAFFIC | Landing Page Views | $50,000 COP/dia |
| Conversaciones WhatsApp | OUTCOME_TRAFFIC | Conversations | $45,000 COP/dia |

#### Clientes Potenciales (Leads)
| Plantilla | Objetivo | Optimizacion | Presupuesto Sugerido |
|-----------|----------|-------------|---------------------|
| Leads por WhatsApp | OUTCOME_LEADS | Lead Generation | $45,000 COP/dia |

#### Ventas
| Plantilla | Objetivo | Optimizacion | Presupuesto Sugerido |
|-----------|----------|-------------|---------------------|
| Conversiones Web | OUTCOME_SALES | Offsite Conversions | $80,000 COP/dia |
| Ventas por WhatsApp | OUTCOME_SALES | Conversations | $55,000 COP/dia |

#### Interaccion
| Plantilla | Objetivo | Optimizacion | Presupuesto Sugerido |
|-----------|----------|-------------|---------------------|
| Mensajes WhatsApp | OUTCOME_ENGAGEMENT | Conversations | $40,000 COP/dia |
| Mensajes Instagram | OUTCOME_ENGAGEMENT | Conversations | $35,000 COP/dia |

### Paso 2: Configuracion de la Campana

Tras seleccionar la plantilla, se configura:

1. **Cuenta publicitaria** - Seleccionar entre las cuentas disponibles
2. **Nombre de la campana**
3. **Presupuesto diario** (en COP)
4. **Pagina de Facebook** - Pagina desde la que se publicaran los anuncios
5. **Cuenta de Instagram** (opcional) - Para publicar tambien en Instagram
6. **URL de destino** - Sitio web o enlace de WhatsApp (segun plantilla)
7. **Publico objetivo** - Audiencias guardadas o configuracion manual
8. **Fecha de finalizacion** (opcional)

### Paso 3: Creacion de Anuncios (Multi-Ad)

#### Estructura de Ad Sets

Se ofrecen dos modos:

- **Mismo publico para todos** - Se crea 1 Ad Set por anuncio, todos con el mismo targeting. El presupuesto CBO distribuye automaticamente entre ellos.
- **Publico diferente por anuncio** - Cada anuncio tiene su propio Ad Set con targeting independiente.

> **Nota tecnica:** Meta requiere Dynamic Creative (`is_dynamic_creative: true`) para el formato 5+5+5, y Dynamic Creative limita a 1 anuncio por Ad Set. Con CBO (Campaign Budget Optimization) a nivel de campana, Meta distribuye el presupuesto entre Ad Sets automaticamente, logrando el mismo efecto que multiples anuncios en 1 Ad Set.

#### Agregar Anuncios

Para cada anuncio se configura:

1. **Nombre del anuncio**
2. **Contenido multimedia** - Tres opciones:
   - Subir archivo (video o imagen)
   - Usar URL de imagen/video
   - Seleccionar de la biblioteca de Meta
3. **Contenido generado por IA** - Al subir un video/imagen, la IA automaticamente:
   - Transcribe el audio del video (Whisper)
   - Analiza visualmente la imagen o frame del video (GPT-4o-mini Vision)
   - Genera 5 titulos + 5 descripciones + 5 CTAs optimizados
4. **Publico** (solo en modo "publico diferente") - Seleccionar audiencia especifica

Se pueden agregar multiples anuncios con el boton **"+ Agregar Otro Anuncio"**.

### Paso 4: Revision y Publicacion

El borrador muestra un resumen de todo lo que se creara:
- Nombre de la campana
- Presupuesto y configuracion
- Cantidad de Ad Sets y anuncios
- Contenido de cada anuncio

Al confirmar, se crea en Meta Ads Manager en estado **PAUSADO** para revision antes de activar.

---

## Generacion de Contenido con IA

### Analisis de Video
1. El video se envia al backend
2. Se extrae el audio con FFmpeg (compresion a MP3 mono 64kbps)
3. Se transcribe con OpenAI Whisper
4. Si hay transcripcion, GPT-4o-mini genera el 5+5+5 basado en el contenido hablado
5. Si no hay audio/habla, se extrae un frame del video y se analiza visualmente

### Analisis de Imagen
1. La imagen se convierte a base64
2. GPT-4o-mini Vision analiza el contenido visual
3. Genera 5 titulos + 5 descripciones + 5 CTAs contextualizados

### Formato 5+5+5
Cada anuncio recibe:
- **5 Titulos** (headlines) - Variaciones del mensaje principal
- **5 Descripciones** (primary text) - Textos descriptivos diferentes
- **5 CTAs** (Call to Action) - Llamadas a la accion compatibles

Meta prueba automaticamente las combinaciones (hasta 125 variaciones por anuncio) y optimiza mostrando las que mejor funcionan.

---

## Estructura en Meta Ads Manager

```
Campana (CBO - presupuesto compartido)
├── Ad Set 1 (Dynamic Creative ON)
│   └── Ad 1 (5 titulos + 5 descripciones + 5 CTAs + video/imagen)
├── Ad Set 2 (Dynamic Creative ON)
│   └── Ad 2 (5 titulos + 5 descripciones + 5 CTAs + video/imagen)
└── Ad Set N...
    └── Ad N...
```

---

## Endpoints del Backend

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/health` | Estado del servicio |
| POST | `/api/analyze-video` | Transcribir video y generar 5+5+5 con IA |
| POST | `/api/analyze-image` | Analizar imagen y generar 5+5+5 con IA |
| POST | `/api/generate-content` | Generar contenido 5+5+5 con prompt libre |
| POST | `/api/upload-video` | Subir video a cuenta de Meta |
| POST | `/api/upload-image` | Subir imagen a cuenta de Meta |
| GET | `/api/video-thumbnail/:videoId` | Obtener miniatura de un video |

El backend corre en el puerto **3002** por defecto.

---

## CTAs Compatibles

Para campanas de trafico (LINK_CLICKS) con Dynamic Creative, solo son validos:

| CTA | Texto |
|-----|-------|
| LEARN_MORE | Mas informacion |
| SHOP_NOW | Comprar ahora |
| SIGN_UP | Registrarse |
| SUBSCRIBE | Suscribirse |
| DOWNLOAD | Descargar |
| GET_OFFER | Obtener oferta |
| APPLY_NOW | Aplicar ahora |
| CONTACT_US | Contactanos |
| GET_QUOTE | Obtener cotizacion |

Para campanas de WhatsApp/Messenger se usa `WHATSAPP_MESSAGE` o `SEND_MESSAGE`.

---

## Permisos Requeridos de Meta

El Access Token debe tener los siguientes permisos:

| Permiso | Uso |
|---------|-----|
| `ads_management` | Crear y editar campanas, ad sets, ads |
| `ads_read` | Leer metricas y datos de campanas |
| `pages_show_list` | Listar paginas de Facebook disponibles |
| `pages_read_engagement` | Leer datos de engagement de paginas |
| `business_management` | Acceder a cuentas publicitarias del Business Manager |

---

## Configuracion de Facebook App

- **App ID:** `2784679235288284`
- **SDK Version:** v18.0
- **Modo:** Desarrollo (solo testers/developers pueden usar login OAuth)
- Para que cualquier usuario use el login de Facebook, la app debe pasar a modo "Activo" con revision de permisos de Meta.

---

## Despliegue en Produccion

### Frontend (Build)
```bash
cd meta-ads-dashboard
npm run build
```
Genera los archivos estaticos en `dist/` listos para servir con cualquier servidor web (Nginx, Vercel, Netlify, etc).

### Backend
```bash
cd meta-ads-dashboard/server
npm start
```
Configurar la variable de entorno `PORT` si se necesita un puerto diferente a 3002.

### Variables de Entorno para Produccion
```env
VITE_API_URL=https://tu-dominio.com/api
```

---

## Limitaciones Conocidas

1. **Dynamic Creative (5+5+5)** requiere `is_dynamic_creative: true` en el Ad Set, lo cual limita a **1 anuncio por Ad Set**. No es posible tener multiples anuncios con 5+5+5 en un solo Ad Set.

2. **Facebook App en modo Desarrollo** - Solo testers/developers pueden usar el login OAuth. Para uso publico se requiere revision de Meta.

3. **Token expiration** - Los tokens de Graph API Explorer expiran cada ~1 hora. Para uso prolongado se necesita un token de larga duracion o System User Token.

4. **Limites de la API de Meta** - La cuenta tiene limites de uso (rate limiting). Si se alcanza el 100%, las llamadas seran rechazadas temporalmente.
