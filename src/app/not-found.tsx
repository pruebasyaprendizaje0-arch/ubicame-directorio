import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050811] text-white flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Página no encontrada</h2>
      <p className="text-slate-400 text-sm mb-4">El lugar o recurso que buscas no existe en el directorio.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold rounded-lg text-sm hover:bg-cyan-400 transition-colors"
      >
        Volver al Directorio
      </Link>
    </div>
  );
}
