# Meta Creative Builder

Sistema automatizado para crear campañas publicitarias en Meta Ads usando IA para analizar assets y generar copies.

## Características

- **Análisis de Assets con IA**: Analiza videos e imágenes para extraer información del producto
- **Generación de Copies 5-5-5-5**: Genera 5 variantes de cada elemento (copy, headline, descripción, CTA)
- **Templates Configurables**: Sistema de templates para diferentes objetivos de campaña
- **Integración con Meta API**: Crea drafts completos (Campaign + AdSet + Creative + Ad) en estado PAUSADO
- **Multi-tenant**: Soporte para múltiples clientes y cuentas publicitarias

## Arquitectura

```
creative-builder/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── api/
│   │   └── routes/            # API endpoints
│   ├── config/
│   │   ├── templates/         # Templates JSON de campañas
│   │   └── index.ts           # Configuración global
│   ├── services/
│   │   ├── ai/                # Proveedores de IA (OpenAI, Mock)
│   │   ├── meta/              # Cliente API de Meta
│   │   └── jobProcessor.ts    # Procesamiento de jobs
│   ├── workers/               # Workers para procesamiento async
│   ├── frontend/              # Páginas React
│   │   └── pages/
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utilidades (logger, encryption)
└── package.json
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- (Opcional) Redis para colas de trabajo
- Cuenta de desarrollador de Meta/Facebook

## Instalación

1. **Clonar e instalar dependencias**:
```bash
cd meta-ads-dashboard/creative-builder
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/meta_creative"

# Meta API
META_ACCESS_TOKEN="tu_token_de_acceso"

# AI (usar 'mock' para desarrollo sin API)
AI_PROVIDER="mock"
# AI_PROVIDER="openai"
# OPENAI_API_KEY="sk-..."

# Security
ENCRYPTION_KEY="min_32_caracteres_random_string_aqui"
JWT_SECRET="tu_jwt_secret_aqui"
```

3. **Inicializar base de datos**:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Iniciar servidor**:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3003`

## API Endpoints

### Assets
- `POST /api/assets` - Subir archivo o registrar URL externa
- `GET /api/assets` - Listar assets
- `GET /api/assets/:id` - Detalles de un asset
- `DELETE /api/assets/:id` - Eliminar asset

### Jobs
- `POST /api/jobs` - Crear nuevo job
- `GET /api/jobs` - Listar jobs
- `GET /api/jobs/:id` - Detalles de un job
- `POST /api/jobs/:id/analyze` - Analizar asset con IA
- `POST /api/jobs/:id/generate` - Generar variantes de copy
- `PUT /api/jobs/:id/select` - Guardar selección del usuario

### Drafts
- `POST /api/jobs/:jobId/draft` - Crear draft en Meta
- `GET /api/drafts` - Listar drafts
- `GET /api/drafts/:id` - Detalles de un draft

### Templates
- `GET /api/templates` - Listar templates disponibles
- `GET /api/templates/:slug` - Detalles de un template
- `POST /api/templates` - Crear nuevo template

### Ad Accounts
- `GET /api/ad-accounts` - Listar cuentas publicitarias
- `POST /api/ad-accounts` - Agregar cuenta publicitaria
- `POST /api/ad-accounts/:id/verify` - Verificar token válido

## Flujo de Trabajo

1. **Subir Asset**: Usuario sube video/imagen
2. **Crear Job**: Se crea un job asociado al asset y template
3. **Análisis IA**: El sistema analiza el asset y genera un brief creativo
4. **Generación**: IA genera 5 variantes de cada elemento
5. **Revisión**: Usuario revisa y selecciona las variantes preferidas
6. **Draft**: Se crea la campaña completa en Meta (PAUSADO)
7. **Activación**: Usuario activa desde Meta Ads Manager

## Templates Incluidos

- `traffic_ig_profile` - Tráfico a perfil de Instagram
- `messages_whatsapp` - Mensajes a WhatsApp
- `conversions_website` - Conversiones en sitio web

## Proveedores de IA

### Mock (Desarrollo)
Genera datos de ejemplo sin llamadas a APIs externas.

```env
AI_PROVIDER="mock"
```

### OpenAI GPT-4 Vision
Usa GPT-4 Vision para análisis y generación.

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-vision-preview"
```

## Seguridad

- Los tokens de acceso se almacenan encriptados (AES-256-GCM)
- Validación de entrada con Zod
- Rate limiting configurable
- Logs sanitizados (sin tokens en texto plano)

## Producción

Para producción, configurar:

```env
NODE_ENV="production"
AI_PROVIDER="openai"
STORAGE_PROVIDER="s3"  # o "r2" para Cloudflare
```

Y usar PM2 o similar:

```bash
npm run build
pm2 start dist/index.js --name creative-builder
```

## Licencia

Privado - DTGP
