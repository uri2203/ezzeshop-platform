# EzzeShop Platform

> Marketplace global de publicidad digital con plataforma de streaming integrada, gestionado por agente IA autónomo.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## Visión

EzzeShop conecta **marcas y clientes** con **creadores de contenido** a través de una **plataforma de streaming propia (EzzeTV)** — todo orquestado por un **agente IA autónomo** que entiende tu negocio, perfila creadores y genera matches perfectos.

### 3 Lados del Marketplace

| Lado | Descripción |
|------|-------------|
| **Clientes / Marcas** | Publican campañas publicitarias, definen presupuesto, nicho y audiencia objetivo |
| **Creadores de Contenido** | Ofrecen su audiencia como inventario publicitario y suben contenido a EzzeTV |
| **Audiencia / Viewers** | Consumen contenido en EzzeTV y ven anuncios relevantes |

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express + TypeScript
- **Base de datos**: PostgreSQL 16
- **IA**: Anthropic Claude API (claude-sonnet-4-6)
- **Auth**: JWT + bcrypt
- **Validación**: Zod
- **Testing**: Jest + Supertest

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Lucide Icons
- **Estado**: Zustand
- **i18n**: next-intl (15 idiomas)
- **HTTP**: Axios

### Mobile
- **Framework**: Expo SDK 51+ / React Native
- **Routing**: Expo Router
- **UI**: NativeWind
- **i18n**: i18next (15 idiomas)
- **HTTP**: React Query + Axios

### Deploy
- **Web**: Vercel
- **Backend + BD**: Render
- **Mobile**: EAS (Expo Application Services)

## Idiomas Soportados (15)

| Código | Idioma | Dirección |
|--------|--------|-----------|
| `es` | Español (base) | LTR |
| `en` | English | LTR |
| `pt` | Português | LTR |
| `fr` | Français | LTR |
| `de` | Deutsch | LTR |
| `it` | Italiano | LTR |
| `zh-CN` | 中文 (简体) | LTR |
| `ja` | 日本語 | LTR |
| `ko` | 한국어 | LTR |
| `ar` | العربية | RTL |
| `hi` | हिन्दी | LTR |
| `ru` | Русский | LTR |
| `tr` | Türkçe | LTR |
| `nl` | Nederlands | LTR |
| `pl` | Polski | LTR |

## Inicio Rápido

### Requisitos Previos
- Node.js 20+
- Docker y Docker Compose
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/uri2203/ezzeshop-platform.git
cd ezzeshop-platform

# Iniciar base de datos local
docker-compose up -d

# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev

# Frontend (nueva terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev

# Mobile (nueva terminal)
cd mobile
cp .env.example .env
npm install
npx expo start
```

### Variables de Entorno

Ver `.env.example` en cada directorio para la configuración completa.

## Estructura del Proyecto

```
ezzeshop-platform/
├── backend/          # API REST + Agente IA
│   ├── src/
│   │   ├── routes/       # Endpoints REST
│   │   ├── controllers/  # Lógica de peticiones
│   │   ├── services/     # Lógica de negocio + IA
│   │   ├── middleware/   # Auth, validación, errores
│   │   ├── models/       # Tipos de BD
│   │   ├── utils/        # Helpers
│   │   └── config/       # Configuración
│   └── migrations/   # Migraciones SQL
├── frontend/         # Next.js 14 App Router
│   ├── src/
│   │   ├── app/         # Rutas (App Router)
│   │   ├── components/  # Componentes reutilizables
│   │   ├── lib/         # Servicios y utilidades
│   │   ├── hooks/       # Custom hooks
│   │   ├── store/       # Estado global (Zustand)
│   │   └── types/       # TypeScript types
│   └── messages/     # Traducciones (15 idiomas)
├── mobile/           # Expo React Native
│   └── src/
│       ├── app/         # Rutas (Expo Router)
│       ├── components/  # Componentes nativos
│       ├── screens/     # Pantallas
│       └── i18n/        # Traducciones mobile
├── docs/             # Documentación técnica
└── docker-compose.yml
```

## Features Principales

- **Agente IA**: Conversación natural para entender negocios, perfilar creadores y hacer matching
- **EzzeTV**: Plataforma de streaming con anuncios pre-roll y analytics
- **Matching Inteligente**: Algoritmo de scoring por país, nicho, presupuesto y audiencia
- **Auth Completo**: Email, Google, Apple, Facebook + biometría en mobile
- **Pagos**: Stripe integrado (web y mobile)
- **Push Notifications**: Firebase Cloud Messaging
- **Offline Support**: Funcionalidad básica sin conexión en mobile
- **Dark Mode**: Tema automático en web y mobile
- **WCAG 2.1 AA**: Accesibilidad completa

## Documentación

- [Arquitectura](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deploy Guide](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)

## Licencia

MIT © 2024 EzzeShop Platform
