'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  KeyRound, Eye, EyeOff, Save, CheckCircle, AlertTriangle,
  Zap, CreditCard, Mail, Globe, Cloud, Bell, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import api from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ApiKeyField {
  key: string;
  label: string;
  placeholder: string;
  secret: boolean;
  docsUrl: string;
  required: boolean;
}

interface ApiGroup {
  id: string;
  icon: React.ElementType;
  color: string;
  titleKey: string;
  descKey: string;
  fields: ApiKeyField[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/* ------------------------------------------------------------------ */
/*  Config groups                                                       */
/* ------------------------------------------------------------------ */

const API_GROUPS: ApiGroup[] = [
  {
    id: 'ai',
    icon: Zap,
    color: 'from-violet-500 to-purple-600',
    titleKey: 'Anthropic (IA Agent)',
    descKey: 'Potencia el agente IA conversacional con Claude claude-sonnet-4-6.',
    fields: [
      {
        key: 'ANTHROPIC_API_KEY',
        label: 'API Key',
        placeholder: 'sk-ant-api03-...',
        secret: true,
        docsUrl: 'https://console.anthropic.com/settings/keys',
        required: true,
      },
    ],
  },
  {
    id: 'stripe',
    icon: CreditCard,
    color: 'from-blue-500 to-indigo-600',
    titleKey: 'Stripe (Pagos)',
    descKey: 'Procesa pagos de campañas y suscripciones.',
    fields: [
      {
        key: 'STRIPE_SECRET_KEY',
        label: 'Secret Key',
        placeholder: 'sk_live_...',
        secret: true,
        docsUrl: 'https://dashboard.stripe.com/apikeys',
        required: true,
      },
      {
        key: 'STRIPE_WEBHOOK_SECRET',
        label: 'Webhook Secret',
        placeholder: 'whsec_...',
        secret: true,
        docsUrl: 'https://dashboard.stripe.com/webhooks',
        required: true,
      },
    ],
  },
  {
    id: 'email',
    icon: Mail,
    color: 'from-emerald-500 to-teal-600',
    titleKey: 'SendGrid (Email)',
    descKey: 'Envío de emails transaccionales: bienvenida, recuperar contraseña, notificaciones.',
    fields: [
      {
        key: 'SENDGRID_API_KEY',
        label: 'API Key',
        placeholder: 'SG.xxxxx...',
        secret: true,
        docsUrl: 'https://app.sendgrid.com/settings/api_keys',
        required: true,
      },
      {
        key: 'EMAIL_FROM',
        label: 'Correo remitente',
        placeholder: 'no-reply@ezzeshop.com',
        secret: false,
        docsUrl: 'https://app.sendgrid.com/settings/sender_auth',
        required: true,
      },
    ],
  },
  {
    id: 'oauth',
    icon: Globe,
    color: 'from-orange-500 to-red-500',
    titleKey: 'Google OAuth',
    descKey: 'Login con cuenta de Google para clientes y creadores.',
    fields: [
      {
        key: 'GOOGLE_CLIENT_ID',
        label: 'Client ID',
        placeholder: 'xxxxx.apps.googleusercontent.com',
        secret: false,
        docsUrl: 'https://console.cloud.google.com/apis/credentials',
        required: false,
      },
      {
        key: 'GOOGLE_CLIENT_SECRET',
        label: 'Client Secret',
        placeholder: 'GOCSPX-...',
        secret: true,
        docsUrl: 'https://console.cloud.google.com/apis/credentials',
        required: false,
      },
    ],
  },
  {
    id: 'storage',
    icon: Cloud,
    color: 'from-sky-500 to-cyan-600',
    titleKey: 'Cloudflare R2 (Almacenamiento)',
    descKey: 'Almacena videos, thumbnails e imágenes de perfil con CDN global.',
    fields: [
      {
        key: 'CLOUDFLARE_R2_ACCESS_KEY',
        label: 'Access Key ID',
        placeholder: 'xxxxx',
        secret: false,
        docsUrl: 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens',
        required: false,
      },
      {
        key: 'CLOUDFLARE_R2_SECRET_KEY',
        label: 'Secret Access Key',
        placeholder: 'xxxxx',
        secret: true,
        docsUrl: 'https://dash.cloudflare.com/?to=/:account/r2/api-tokens',
        required: false,
      },
      {
        key: 'CLOUDFLARE_R2_BUCKET',
        label: 'Nombre del bucket',
        placeholder: 'ezzeshop-media',
        secret: false,
        docsUrl: 'https://dash.cloudflare.com/?to=/:account/r2',
        required: false,
      },
      {
        key: 'CLOUDFLARE_R2_ENDPOINT',
        label: 'Endpoint URL',
        placeholder: 'https://xxx.r2.cloudflarestorage.com',
        secret: false,
        docsUrl: 'https://dash.cloudflare.com/?to=/:account/r2',
        required: false,
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    color: 'from-pink-500 to-rose-600',
    titleKey: 'Firebase (Push Notifications)',
    descKey: 'Notificaciones push para la app móvil Android.',
    fields: [
      {
        key: 'FIREBASE_PROJECT_ID',
        label: 'Project ID',
        placeholder: 'ezzeshop-xxx',
        secret: false,
        docsUrl: 'https://console.firebase.google.com',
        required: false,
      },
      {
        key: 'FIREBASE_PRIVATE_KEY',
        label: 'Private Key (JSON)',
        placeholder: '{"type":"service_account",...}',
        secret: true,
        docsUrl: 'https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk',
        required: false,
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Field component                                                     */
/* ------------------------------------------------------------------ */

function KeyInput({
  field,
  value,
  onChange,
}: {
  field: ApiKeyField;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        <a
          href={field.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Dónde encontrarla →
        </a>
      </div>
      <div className="relative">
        <input
          type={field.secret && !visible ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {field.secret && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Group card                                                          */
/* ------------------------------------------------------------------ */

function GroupCard({ group, values, onChange }: {
  group: ApiGroup;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  const Icon = group.icon;
  const hasRequired = group.fields.some((f) => f.required);
  const allRequiredFilled = group.fields
    .filter((f) => f.required)
    .every((f) => values[f.key]?.trim());

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${group.color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{group.titleKey}</h3>
            {hasRequired && (
              allRequiredFilled
                ? <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"><CheckCircle className="h-3 w-3" /> Configurado</span>
                : <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600"><AlertTriangle className="h-3 w-3" /> Pendiente</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{group.descKey}</p>
        </div>
      </div>

      <div className="space-y-4">
        {group.fields.map((field) => (
          <KeyInput
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const t = useTranslations('common');

  const allKeys = API_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(allKeys.map((k) => [k, ''])),
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaveStatus('idle');
  }

  async function handleSave() {
    setSaveStatus('saving');
    setErrorMsg('');
    try {
      // Only send filled values
      const payload = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v.trim() !== ''),
      );
      await api.put('/admin/config/api-keys', payload);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: unknown) {
      setSaveStatus('error');
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? 'Error al guardar. Inténtalo de nuevo.');
    }
  }

  const pendingCount = API_GROUPS.filter((g) =>
    g.fields.some((f) => f.required && !values[f.key]?.trim()),
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Configuración de APIs</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Conecta los servicios externos que necesita la plataforma. Las keys se guardan
              cifradas en el servidor y nunca se exponen al cliente.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {pendingCount} servicio{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
            {pendingCount === 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                <ShieldCheck className="h-3 w-3" /> Todo configurado
              </span>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-8 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-700 dark:text-blue-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Las API keys se envían por HTTPS y se almacenan cifradas en PostgreSQL. Nunca
            aparecen en los logs ni se incluyen en respuestas al cliente. Solo el servidor
            las lee en tiempo de ejecución.
          </span>
        </div>

        {/* Groups */}
        <div className="space-y-6">
          {API_GROUPS.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              values={values}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Save bar */}
        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            Los campos vacíos no sobreescriben valores existentes.
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle className="h-4 w-4" /> Guardado
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-rose-600">{errorMsg}</span>
            )}
            <Button
              variant="gradient"
              onClick={() => void handleSave()}
              isLoading={saveStatus === 'saving'}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar configuración
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
