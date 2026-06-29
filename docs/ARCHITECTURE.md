# EzzeShop Platform - Arquitectura Técnica

## Visión General

EzzeShop es un marketplace de 3 lados con un agente IA central que orquesta todas las interacciones.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES / MARCAS                        │
│              Crean campañas, definen presupuesto y nicho        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                    ┌─────▼──────┐
                    │  AGENTE IA │  ← Anthropic Claude
                    │  (Matching)│
                    └─────┬──────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   CREADORES DE CONTENIDO                        │
│            Suben contenido a EzzeTV, ofrecen audiencia          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    AUDIENCIA / VIEWERS                          │
│              Consumen contenido en EzzeTV con anuncios          │
└─────────────────────────────────────────────────────────────────┘
```

## Stack y Justificaciones

### Backend: Node.js + Express + TypeScript
- **Por qué Node.js**: Excelente para I/O asíncrono (streaming, WebSockets, API calls a Anthropic)
- **Por qué Express**: Mínimo overhead, control total del middleware stack
- **Por qué TypeScript**: Type safety crítico para un sistema financiero/publicitario

### Base de Datos: PostgreSQL
- **Por qué Postgres**: ACID compliance para transacciones financieras, JSONB para memoria del agente IA, full-text search para búsqueda de contenido

### Frontend: Next.js 14 App Router
- **Por qué App Router**: Server Components para SEO, Streaming SSR para performance
- **Por qué next-intl**: La solución más robusta para i18n en Next.js 14

### Mobile: Expo SDK 51
- **Por qué Expo**: Acceso a APIs nativas (biometría, cámara, notificaciones) con DX excelente
- **Por qué Expo Router**: File-based routing consistente con Next.js

## Flujo de Datos

```
Mobile/Web App
     │
     ▼
API Gateway (Express)
     │
     ├── Auth Middleware (JWT)
     ├── Rate Limiter
     ├── Validation (Zod)
     │
     ▼
Controllers
     │
     ├── AI Service (Anthropic SDK)
     │        └── Memoria en PostgreSQL (JSONB)
     │
     ├── Matching Service
     │        └── Scoring Algorithm
     │
     ├── Streaming Service
     │        └── HLS / S3/R2 Storage
     │
     └── Payment Service (Stripe)
```

## Seguridad

- JWT con refresh tokens (15min access, 7d refresh)
- bcrypt para hashing de passwords (rounds: 12)
- Helmet.js para headers HTTP seguros
- Rate limiting por IP y por usuario
- Validación estricta con Zod en todas las rutas
- Variables sensibles solo en servidor (nunca en cliente)
- HTTPS obligatorio en producción

## Escalabilidad

- Backend stateless → escala horizontal fácilmente en Render
- Redis para caché de sesiones y rate limiting distribuido
- S3/R2 para almacenamiento de media (no en servidor)
- PostgreSQL con connection pooling (pg-pool)

## Internacionalización (i18n)

### Web (next-intl)
- Detección automática via `accept-language` header
- Persistencia en cookie `NEXT_LOCALE`
- URLs localizadas: `/es/marcas`, `/en/brands`
- RTL automático para árabe

### Mobile (i18next + expo-localization)
- Detección automática del dispositivo
- Persistencia en AsyncStorage
- Lazy loading de traducciones por idioma

## Monorepo Strategy

Los tipos TypeScript compartidos se mantienen en `backend/src/types/` y se referencian
desde frontend y mobile a través de definiciones locales espejadas. En el futuro
se puede migrar a un monorepo con Turborepo + workspace packages.
