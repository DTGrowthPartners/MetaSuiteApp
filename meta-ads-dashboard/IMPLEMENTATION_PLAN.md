# Plan de Implementación - Meta Ads Creative Builder

## Resumen Ejecutivo
Sistema completo para crear campañas de Meta Ads desde assets (video/imagen) usando IA para análisis y generación de copies.

---

## FASE 1: Draft Builder sin IA (MVP)
**Duración estimada: 1 semana**

### Objetivos
- Subida de assets (video/imagen)
- Selección manual de configuración
- Creación de drafts en Meta (Campaign + AdSet + Creative + Ad en PAUSED)

### Entregables
- [ ] Estructura de proyecto Next.js + Backend Node
- [ ] Base de datos Postgres + Prisma
- [ ] Módulos Meta API para crear campañas
- [ ] UI básica de upload y creación
- [ ] Sistema de templates

---

## FASE 2: IA para Análisis y Generación
**Duración estimada: 2 semanas**

### Objetivos
- Pipeline de análisis de video (keyframes + audio + OCR)
- Pipeline de análisis de imagen (OCR + visual)
- Generación automática de CreativeBrief
- Generación 5-5-5-5 (copies, headlines, descriptions, CTAs)

### Entregables
- [ ] Worker async con BullMQ + Redis
- [ ] Módulo de extracción de video (ffmpeg)
- [ ] Integración con modelo multimodal (OpenAI/Claude)
- [ ] Generador de variantes
- [ ] UI de review y selección

---

## FASE 3: Learning Loop y Optimización
**Duración estimada: 2 semanas**

### Objetivos
- Tracking de performance de ads creados
- Feedback loop para mejorar generación
- A/B testing automatizado
- Dashboard de métricas

### Entregables
- [ ] Sync de métricas desde Meta
- [ ] Scoring de copies basado en CTR/CPR
- [ ] Modelo de recomendación mejorado
- [ ] Dashboard de analytics

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Next.js App (React + TypeScript)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Upload  │  │  Review  │  │  Draft   │  │ Dashboard│        │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Express)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ /assets  │  │  /jobs   │  │ /drafts  │  │/templates│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   QUEUE         │  │   DATABASE      │  │   STORAGE       │
│   BullMQ+Redis  │  │   Postgres      │  │   S3/R2         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WORKER PROCESSES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ VideoAnalyzer│  │ CopyGenerator│  │ MetaPublisher│          │
│  │  - ffmpeg    │  │  - OpenAI    │  │  - API calls │          │
│  │  - Whisper   │  │  - Templates │  │  - Validation│          │
│  │  - OCR       │  │  - Scoring   │  │  - Retry     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    META MARKETING API                            │
│  - Upload Video/Image                                            │
│  - Create Campaign (PAUSED)                                      │
│  - Create AdSet (PAUSED)                                         │
│  - Create Creative                                               │
│  - Create Ad (PAUSED)                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Carpetas

```
meta-ads-dashboard/
├── src/                          # Frontend React existente
├── server/                       # Backend existente (API simple)
└── creative-builder/             # NUEVO: Sistema completo
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── prisma/
    │   └── schema.prisma         # Modelo de datos
    ├── src/
    │   ├── index.ts              # Entry point
    │   ├── config/
    │   │   ├── index.ts
    │   │   └── templates/        # JSON templates
    │   │       ├── traffic_ig_profile.json
    │   │       ├── messages_whatsapp.json
    │   │       └── conversions_website.json
    │   ├── api/
    │   │   ├── routes/
    │   │   │   ├── assets.ts
    │   │   │   ├── jobs.ts
    │   │   │   ├── drafts.ts
    │   │   │   └── templates.ts
    │   │   └── middleware/
    │   │       ├── auth.ts
    │   │       └── validation.ts
    │   ├── services/
    │   │   ├── meta/
    │   │   │   ├── index.ts
    │   │   │   ├── upload.ts
    │   │   │   ├── campaign.ts
    │   │   │   ├── adset.ts
    │   │   │   ├── creative.ts
    │   │   │   └── ad.ts
    │   │   ├── ai/
    │   │   │   ├── index.ts
    │   │   │   ├── analyzer.ts
    │   │   │   ├── generator.ts
    │   │   │   └── providers/
    │   │   │       ├── openai.ts
    │   │   │       └── mock.ts
    │   │   ├── storage/
    │   │   │   ├── index.ts
    │   │   │   ├── s3.ts
    │   │   │   └── mock.ts
    │   │   └── media/
    │   │       ├── video.ts      # ffmpeg operations
    │   │       ├── image.ts
    │   │       └── ocr.ts
    │   ├── workers/
    │   │   ├── index.ts
    │   │   ├── analyze.worker.ts
    │   │   ├── generate.worker.ts
    │   │   └── publish.worker.ts
    │   ├── types/
    │   │   ├── index.ts
    │   │   ├── creative-brief.ts
    │   │   ├── meta-api.ts
    │   │   └── templates.ts
    │   └── utils/
    │       ├── logger.ts
    │       ├── encryption.ts
    │       └── validators.ts
    └── frontend/                 # UI Pages (puede ser Next.js separado)
        ├── pages/
        │   ├── upload.tsx
        │   ├── review/[jobId].tsx
        │   └── draft/[jobId].tsx
        └── components/
            ├── AssetUploader.tsx
            ├── CreativeBriefCard.tsx
            ├── CopyVariants.tsx
            └── DraftBuilder.tsx
```

---

## Modelo de Datos (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Client {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  adAccounts    AdAccount[]
  assets        Asset[]
  jobs          Job[]
}

model AdAccount {
  id              String   @id @default(uuid())
  metaAccountId   String   // act_123456789
  name            String
  clientId        String
  pageId          String?  // For creative association
  igActorId       String?  // Instagram account ID
  accessToken     String   // Encrypted
  tokenExpiresAt  DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  client          Client   @relation(fields: [clientId], references: [id])
  jobs            Job[]
  drafts          Draft[]
}

model Asset {
  id            String    @id @default(uuid())
  clientId      String
  type          AssetType
  filename      String
  originalName  String
  mimeType      String
  size          Int
  storageUrl    String
  thumbnailUrl  String?
  duration      Float?    // For videos (seconds)
  width         Int?
  height        Int?
  createdAt     DateTime  @default(now())

  client        Client    @relation(fields: [clientId], references: [id])
  jobs          Job[]
}

enum AssetType {
  VIDEO
  IMAGE
}

model Job {
  id              String      @id @default(uuid())
  clientId        String
  adAccountId     String
  assetId         String
  templateId      String
  status          JobStatus   @default(PENDING)

  // Analysis results
  creativeBrief   Json?       // CreativeBrief object

  // Generated content
  copies          Json?       // Array of 5 primary texts
  headlines       Json?       // Array of 5 headlines
  descriptions    Json?       // Array of 5 descriptions
  ctas            Json?       // Array of 5 CTAs
  bestPick        Json?       // Recommended combination

  // Selected by user
  selectedCopy    Int?        // Index 0-4
  selectedHeadline Int?
  selectedDescription Int?
  selectedCta     Int?

  // Processing
  error           String?
  processingStartedAt DateTime?
  processingCompletedAt DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  client          Client      @relation(fields: [clientId], references: [id])
  adAccount       AdAccount   @relation(fields: [adAccountId], references: [id])
  asset           Asset       @relation(fields: [assetId], references: [id])
  draft           Draft?
}

enum JobStatus {
  PENDING
  ANALYZING
  ANALYZED
  GENERATING
  GENERATED
  READY_FOR_DRAFT
  CREATING_DRAFT
  DRAFT_CREATED
  ERROR
}

model Draft {
  id              String      @id @default(uuid())
  jobId           String      @unique
  adAccountId     String

  // Meta object IDs
  campaignId      String?
  adSetId         String?
  creativeId      String?
  adId            String?

  // Status tracking
  campaignStatus  String?
  adSetStatus     String?
  creativeStatus  String?
  adStatus        String?

  // Meta response data
  metaResponse    Json?

  // Audit
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  publishedAt     DateTime?

  job             Job         @relation(fields: [jobId], references: [id])
  adAccount       AdAccount   @relation(fields: [adAccountId], references: [id])
  auditLogs       AuditLog[]
}

model AuditLog {
  id          String   @id @default(uuid())
  draftId     String?
  action      String
  endpoint    String?
  request     Json?    // Sanitized (no tokens)
  response    Json?    // Sanitized
  status      String?
  error       String?
  createdAt   DateTime @default(now())

  draft       Draft?   @relation(fields: [draftId], references: [id])
}

model Template {
  id                  String   @id @default(uuid())
  name                String
  slug                String   @unique
  description         String?
  objective           String   // OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, etc.
  optimizationGoal    String
  billingEvent        String
  placements          Json     // Placement configuration
  budgetDefault       Json     // {daily: 10000, lifetime: null}
  schedule            Json?    // Optional schedule config
  targetingBase       Json?    // Base targeting (editable)
  allowedCtas         String[] // ['LEARN_MORE', 'SHOP_NOW', etc.]
  creativeSpec        Json     // video_data or image_data spec
  destination         Json     // URL/destination config
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## Endpoints REST

### Assets
```
POST   /api/assets              # Upload asset
GET    /api/assets              # List assets
GET    /api/assets/:id          # Get asset details
DELETE /api/assets/:id          # Delete asset
```

### Jobs
```
POST   /api/jobs                # Create new job (upload + config)
GET    /api/jobs                # List jobs
GET    /api/jobs/:id            # Get job with results
POST   /api/jobs/:id/analyze    # Trigger analysis
POST   /api/jobs/:id/generate   # Trigger copy generation
PUT    /api/jobs/:id/select     # Save user selection
POST   /api/jobs/:id/draft      # Create draft in Meta
```

### Templates
```
GET    /api/templates           # List available templates
GET    /api/templates/:slug     # Get template details
```

### Drafts
```
GET    /api/drafts              # List drafts
GET    /api/drafts/:id          # Get draft details with Meta IDs
POST   /api/drafts/:id/publish  # Activate (change to ACTIVE) - Future
```

---

## Ejemplo de Request/Response

### POST /api/jobs
```json
// Request
{
  "clientId": "uuid",
  "adAccountId": "uuid",
  "assetId": "uuid",
  "templateId": "traffic_ig_profile"
}

// Response
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "2024-01-15T..."
  }
}
```

### GET /api/jobs/:id (after analysis)
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "GENERATED",
    "creativeBrief": {
      "product_or_service": "Curso de Marketing Digital",
      "offer": "50% de descuento primera semana",
      "category": "education",
      "target_audience": "Emprendedores 25-45 años",
      "key_benefits": ["Aprende desde cero", "Certificado incluido", "Acceso de por vida"],
      "angle": "urgency",
      "tone": "professional_friendly",
      "objective_recommended": "traffic_ig_profile",
      "format": "9:16",
      "detected_text": ["OFERTA", "50%", "MARKETING"],
      "transcript_summary": "Promoción de curso con testimonios...",
      "safety_flags": [],
      "suggested_ctas": ["LEARN_MORE", "SIGN_UP"]
    },
    "copies": [
      "🚀 Domina el Marketing Digital en 30 días. Únete ahora con 50% OFF y transforma tu negocio.",
      "Aprende Marketing Digital desde cero. Más de 5,000 estudiantes ya lo lograron. ¿Eres el siguiente?",
      // ... 3 más
    ],
    "headlines": [
      "Curso Marketing Digital",
      "50% OFF Solo Hoy",
      // ... 3 más
    ],
    "descriptions": [
      "Aprende paso a paso con expertos",
      "Certificado + Acceso de por vida",
      // ... 3 más
    ],
    "ctas": ["LEARN_MORE", "SIGN_UP", "SHOP_NOW", "SUBSCRIBE", "GET_QUOTE"],
    "bestPick": {
      "copyIndex": 0,
      "headlineIndex": 1,
      "descriptionIndex": 0,
      "ctaIndex": 0,
      "score": 0.87,
      "reasoning": "Combina urgencia con beneficio claro"
    }
  }
}
```

### POST /api/jobs/:id/draft
```json
// Request
{
  "selectedCopy": 0,
  "selectedHeadline": 1,
  "selectedDescription": 0,
  "selectedCta": 0,
  "campaignName": "Marketing Digital - IG Profile - Enero",
  "dailyBudget": 50000  // COP
}

// Response
{
  "success": true,
  "draft": {
    "id": "uuid",
    "campaignId": "123456789",
    "adSetId": "987654321",
    "creativeId": "456789123",
    "adId": "789123456",
    "status": "DRAFT_CREATED",
    "metaUrls": {
      "campaign": "https://business.facebook.com/adsmanager/manage/campaigns?act=123&selected_campaign_ids=123456789",
      "adSet": "https://business.facebook.com/adsmanager/manage/adsets?act=123&selected_adset_ids=987654321"
    }
  }
}
```

---

## Configuración (.env.example)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/meta_creative_builder"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# Meta API
META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
META_ACCESS_TOKEN="your_access_token"  # Default token (can be overridden per client)

# Storage (S3/R2)
STORAGE_PROVIDER="mock"  # "s3" | "r2" | "mock"
S3_BUCKET="meta-creative-assets"
S3_REGION="us-east-1"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""

# AI Provider
AI_PROVIDER="mock"  # "openai" | "anthropic" | "mock"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Security
ENCRYPTION_KEY="32-byte-hex-key-for-token-encryption"
JWT_SECRET="your-jwt-secret"

# App
PORT=3003
NODE_ENV="development"
LOG_LEVEL="debug"
```

---

## Consideraciones de Compliance

### Políticas de Meta Ads
- No prometer resultados específicos (ROI, ventas garantizadas)
- Evitar claims médicos sin respaldo
- No usar lenguaje discriminatorio
- Respetar restricciones de categorías especiales (crédito, empleo, vivienda)

### Safety Flags Detectados
El sistema detectará y alertará sobre:
- Claims de salud/médicos
- Promesas de ingresos
- Contenido para adultos
- Lenguaje agresivo/ofensivo
- Marcas registradas sin autorización

### Guardrails en Generación
- Filtrar copies que excedan límites de caracteres
- Validar CTAs contra lista permitida de Meta
- Rechazar contenido que viole políticas
- Agregar disclaimers cuando sea necesario

---

## Pasos para Ejecutar

```bash
# 1. Instalar dependencias
cd creative-builder
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Inicializar base de datos
npx prisma migrate dev

# 4. Iniciar Redis (para queue)
docker run -d -p 6379:6379 redis

# 5. Iniciar servidor
npm run dev

# 6. Iniciar worker (en otra terminal)
npm run worker

# 7. Acceder a la aplicación
# API: http://localhost:3003
# Frontend: http://localhost:3000 (si está separado)
```
