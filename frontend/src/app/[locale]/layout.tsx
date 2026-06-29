import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import { locales, isRtl, type Locale } from '../../lib/i18n';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'hero' });
  return {
    title: { default: 'EzzeShop', template: '%s | EzzeShop' },
    description: t('subtitle'),
    metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://ezzeshop.com'),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: 'website',
      siteName: 'EzzeShop',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const locale = params.locale as Locale;
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
