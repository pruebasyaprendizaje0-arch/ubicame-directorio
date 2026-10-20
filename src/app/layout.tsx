import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ubicame Directory | Directorio de Negocios y Puntos Clave en Ecuador',
  description: 'Descubre los mejores restaurantes, cafeterías, hoteles, servicios esenciales y puntos de referencia en Santa Elena, Guayaquil, Quito y más. Conectado al ecosistema ubicame.cc.',
  keywords: ['directorio ecuador', 'ubicame.info', 'ubicame.cc', 'montañita', 'olón', 'salinas', 'guayaquil', 'restaurantes ecuador', 'turismo ecuador'],
  authors: [{ name: 'Ubicame Team' }],
  openGraph: {
    title: 'Ubicame Directory | Directorio Oficial ubicame.info',
    description: 'Encuentra comercios, cartas digitales y puntos de referencia en Ecuador sin duplicados.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/lugar.svg" type="image/svg+xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
