'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Lugar } from '@/types/lugar';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface ParsedRowResult {
  lugar: Lugar;
  isValid: boolean;
  warnings: string[];
}

export const BatchExcelUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'p1' | 'warnings'>('all');

  // Submit state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    meta?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to slugify text
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Helper to infer icon
  const inferIcon = (tipo: string, currentIcon?: string): string => {
    if (currentIcon && currentIcon.trim()) {
      return currentIcon.trim();
    }
    const t = (tipo || '').toLowerCase();
    if (t.includes('restaurante') || t.includes('comida') || t.includes('gastro')) return 'restaurante.svg';
    if (t.includes('cafe') || t.includes('cafeteria') || t.includes('panaderia')) return 'cafeteria.svg';
    if (t.includes('hotel') || t.includes('hospedaje') || t.includes('hostal') || t.includes('alojamiento') || t.includes('cabañas')) return 'hotel.svg';
    if (t.includes('bar') || t.includes('lounge') || t.includes('pub')) return 'bar.svg';
    if (t.includes('playa') || t.includes('mar') || t.includes('surf') || t.includes('tour') || t.includes('kayak')) return 'playa.svg';
    if (t.includes('farmacia') || t.includes('botica')) return 'farmacia.svg';
    if (t.includes('taxi') || t.includes('transporte') || t.includes('cooperativa')) return 'taxi.svg';
    if (t.includes('hospital') || t.includes('salud') || t.includes('clinica')) return 'salud.svg';
    if (t.includes('iglesia') || t.includes('santuario') || t.includes('templo')) return 'iglesia.svg';
    if (t.includes('artesania') || t.includes('comercio') || t.includes('toquilla')) return 'artesanias.svg';
    return 'lugar.svg';
  };

  // Process Excel / CSV Buffer
  const processFile = async (selectedFile: File) => {
    setLoadingFile(true);
    setFile(selectedFile);
    setImportResult(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Look for sheet named "Lugares" or pick the first available
      const sheetName =
        workbook.SheetNames.find(s => s.toLowerCase().includes('lugar')) ||
        workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const results: ParsedRowResult[] = [];

      rawRows.forEach((row) => {
        // Normalize object keys (case insensitive / trimmed)
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach(k => {
          normalized[k.trim().toLowerCase()] = row[k];
        });

        // Smart column mapping supporting standard and client template columns
        const nombre = String(
          normalized['nombre negocio'] ||
          normalized['nombre del negocio'] ||
          normalized['nombre'] ||
          ''
        ).trim();

        if (!nombre) return; // Skip empty rows

        const warnings: string[] = [];
        const zona = String(
          normalized['comuna'] ||
          normalized['zona'] ||
          normalized['sector'] ||
          'Olón'
        ).trim();

        const tipo = String(
          normalized['categoria'] ||
          normalized['tipo'] ||
          'General'
        ).trim();

        const ciudad = String(normalized['ciudad'] || 'Santa Elena').trim();
        const provincia = String(normalized['provincia'] || 'Santa Elena').trim();

        // id_slug
        let id_slug = String(normalized['id_slug'] || normalized['slug'] || '').trim();
        if (!id_slug) {
          id_slug = `${slugify(nombre)}-${slugify(zona)}`;
          warnings.push('Slug generado automáticamente a partir del nombre y comuna.');
        }

        // Coordinates with smart zone fallback
        const rawLat = normalized['latitud'] || normalized['lat'];
        const rawLng = normalized['longitud'] || normalized['lng'] || normalized['long'];
        let latitud = parseFloat(rawLat);
        let longitud = parseFloat(rawLng);

        if (isNaN(latitud) || isNaN(longitud)) {
          // Defaults based on zona
          const zLower = zona.toLowerCase();
          if (zLower.includes('cadeate')) {
            latitud = -1.8825;
            longitud = -80.7380;
          } else if (zLower.includes('manglaralto')) {
            latitud = -1.8490;
            longitud = -80.7445;
          } else if (zLower.includes('montañita') || zLower.includes('montanita')) {
            latitud = -1.8285;
            longitud = -80.7532;
          } else {
            // Olón
            latitud = -1.8021;
            longitud = -80.7605;
          }
          warnings.push(`Coordenadas asignadas automáticamente para el sector de ${zona}.`);
        }

        // Priority & Origin
        const rawVerificacion = String(
          normalized['estado verificación'] ||
          normalized['estado verificacion'] ||
          normalized['estado'] ||
          ''
        ).toLowerCase();

        let prioridad = parseInt(normalized['prioridad'], 10);
        let origen: 'ubicame_cc' | 'directorio_info' =
          String(normalized['origen'] || '').toLowerCase() === 'ubicame_cc' ? 'ubicame_cc' : 'directorio_info';

        if (isNaN(prioridad) || prioridad < 1 || prioridad > 3) {
          if (origen === 'ubicame_cc') {
            prioridad = 1;
          } else if (rawVerificacion.includes('verificado') && !rawVerificacion.includes('pendiente')) {
            prioridad = 2; // Negocio verificado
          } else {
            prioridad = 3; // Regular / Pendiente
          }
        }

        // WhatsApp cleaning (+593 -> 593...)
        const rawWhatsapp = String(
          normalized['whatsapp público'] ||
          normalized['whatsapp publico'] ||
          normalized['whatsapp'] ||
          normalized['telefono'] ||
          ''
        );
        let whatsapp = rawWhatsapp.replace(/\D/g, '');
        if (whatsapp && !whatsapp.startsWith('593')) {
          if (whatsapp.startsWith('0')) {
            whatsapp = `593${whatsapp.slice(1)}`;
          } else {
            whatsapp = `593${whatsapp}`;
          }
        }

        // URL / Profile / Website
        const rawUrl = String(
          normalized['fuente verificable (url o instrucciones)'] ||
          normalized['fuente verificable'] ||
          normalized['url_perfil'] ||
          normalized['perfil'] ||
          normalized['menu'] ||
          ''
        ).trim();

        const url_perfil = rawUrl.startsWith('http') ? rawUrl : undefined;

        // Description / Notes
        const notas = String(
          normalized['notas'] ||
          normalized['descripcion'] ||
          normalized['detalle'] ||
          ''
        ).trim();

        const descripcion = notas || `Ubicado en la comuna de ${zona}, Santa Elena. Servicios de ${tipo}.`;
        const icono = inferIcon(tipo, String(normalized['icono'] || ''));

        const es_referencia = Boolean(
          normalized['es_referencia'] ||
          tipo.toLowerCase().includes('referencia') ||
          tipo.toLowerCase().includes('iglesia') ||
          tipo.toLowerCase().includes('parque')
        );

        const es_servicio = Boolean(
          normalized['es_servicio'] ||
          tipo.toLowerCase().includes('servicio') ||
          tipo.toLowerCase().includes('farmacia') ||
          tipo.toLowerCase().includes('taxi')
        );

        const estado: 'activo' | 'pendiente' =
          rawVerificacion.includes('pendiente') || String(normalized['estado'] || '').toLowerCase() === 'pendiente'
            ? 'pendiente'
            : 'activo';

        const lugar: Lugar = {
          id_slug,
          nombre,
          tipo,
          icono,
          provincia,
          ciudad,
          zona,
          latitud,
          longitud,
          es_referencia,
          es_servicio,
          prioridad,
          origen,
          whatsapp: whatsapp || undefined,
          url_perfil,
          estado,
          descripcion,
        };

        results.push({
          lugar,
          isValid: true,
          warnings,
        });
      });

      setParsedRows(results);
    } catch (err: any) {
      console.error('Error al procesar archivo:', err);
      alert(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Download Sample Template (.xlsx)
  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        Comuna: 'Manglaralto',
        'Nombre Negocio': 'Hostal Mamacucha',
        Categoria: 'Alojamiento',
        'Email Público': 'info@hostalmamacucha.ec',
        'WhatsApp Público': '+593 98 765 4321',
        'Fuente Verificable (URL o Instrucciones)': 'https://www.instagram.com/hostalmamacucha.ec/',
        'Estado Verificación': 'Verificado',
        Fecha: '2026-07-10',
        Notas: 'Hospedaje acogedor frente al mar en Manglaralto',
      },
      {
        Comuna: 'Montañita',
        'Nombre Negocio': 'El Pescador Restaurant',
        Categoria: 'Gastronomía',
        'Email Público': 'reservas@elpescadormontaneta.ec',
        'WhatsApp Público': '+593 96 555 7788',
        'Fuente Verificable (URL o Instrucciones)': 'https://www.instagram.com/elpescadormontaneta.ec/',
        'Estado Verificación': 'Verificado',
        Fecha: '2026-07-10',
        Notas: 'Mariscos frescos y pesca del día frente a la playa',
      },
      {
        Comuna: 'Olón',
        'Nombre Negocio': 'Olón Kayak Tours',
        Categoria: 'Servicios',
        'Email Público': 'info@olonkayaktours.ec',
        'WhatsApp Público': '+593 99 333 4444',
        'Fuente Verificable (URL o Instrucciones)': 'https://www.olonkayaktours.ec',
        'Estado Verificación': 'Verificado',
        Fecha: '2026-07-10',
        Notas: 'Excursiones guiadas en kayak por el estero de Olón',
      },
      {
        Comuna: 'Cadeate',
        'Nombre Negocio': 'Artesanías Cadeate Tradicional',
        Categoria: 'Comercio y Artesanías',
        'Email Público': 'artesaniascadate@gmail.com',
        'WhatsApp Público': '+593 97 111 2222',
        'Fuente Verificable (URL o Instrucciones)': 'https://www.facebook.com/ArtesaniasCadeateTradicional/',
        'Estado Verificación': 'Verificado',
        Fecha: '2026-07-10',
        Notas: 'Artesanías en madera y paja toquilla tradicional',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lugares');

    XLSX.writeFile(workbook, 'plantilla_negocios_ubicame.xlsx');
  };

  // Submit batch to API
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      const payload = {
        lugares: parsedRows.map(r => r.lugar),
      };

      const res = await fetch('/api/admin/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fallo durante la inserción por lotes');
      }

      setImportResult({
        success: true,
        message: data.message,
        meta: data.meta,
      });
    } catch (err: any) {
      setImportResult({
        success: false,
        message: err.message || 'Error de conexión con el servidor',
      });
    } finally {
      setImporting(false);
    }
  };

  // Metrics
  const totalRows = parsedRows.length;
  const p1Count = parsedRows.filter(r => r.lugar.prioridad === 1 || r.lugar.origen === 'ubicame_cc').length;
  const warningCount = parsedRows.filter(r => r.warnings.length > 0).length;

  const filteredDisplayRows = parsedRows.filter(r => {
    if (filterMode === 'p1') return r.lugar.prioridad === 1 || r.lugar.origen === 'ubicame_cc';
    if (filterMode === 'warnings') return r.warnings.length > 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar with Download Template */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="text-cyan-400" size={18} />
            <span>Formato Oficial de Carga (.xlsx / .csv)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compatible con Excel de Microsoft, Google Sheets y LibreOffice. Hojas con encabezados oficiales.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-slate-700 hover:text-white transition-all shadow-sm cursor-pointer"
        >
          <Download size={14} />
          <span>Descargar Plantilla (.xlsx)</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          file
            ? 'border-cyan-500/60 bg-cyan-950/15'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
          <UploadCloud size={32} />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          {file ? file.name : 'Arrastra y suelta tu archivo de Excel aquí'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {file
            ? `Archivo listo para validación (${(file.size / 1024).toFixed(1)} KB). Haz clic para cambiarlo.`
            : 'Soporta archivos .xlsx y .csv. Reconoce automáticamente columnas como Comuna, Nombre Negocio, Categoria, WhatsApp, etc.'}
        </p>

        {loadingFile && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-400 font-semibold bg-cyan-950/60 px-3 py-1.5 rounded-full border border-cyan-800">
            <RefreshCw size={14} className="animate-spin" />
            <span>Procesando celdas y validando columnas...</span>
          </div>
        )}
      </div>

      {/* Metrics & Analysis Cards */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Filas Detectadas</span>
              <div className="text-xl font-extrabold text-white mt-0.5">{totalRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Registros Válidos</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{totalRows}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Con Advertencias</span>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">{warningCount}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-amber-950/20">
              <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                <Sparkles size={12} />
                <span>Clientes P1 ubicame.cc</span>
              </span>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">{p1Count}</div>
            </div>
          </div>

          {/* Table Controls & Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                Todos ({totalRows})
              </button>

              <button
                onClick={() => setFilterMode('p1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterMode === 'p1'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-amber-300/80 hover:text-amber-200'
                }`}
              >
                Solo Prioridad 1 ({p1Count})
              </button>

              {warningCount > 0 && (
                <button
                  onClick={() => setFilterMode('warnings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterMode === 'warnings'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  Con Advertencias ({warningCount})
                </button>
              )}
            </div>

            {/* Confirm Import Action Button */}
            <button
              onClick={handleConfirmImport}
              disabled={importing || totalRows === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {importing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Insertando registros por lotes...</span>
                </>
              ) : (
                <>
                  <Database size={15} />
                  <span>Confirmar e Importar {totalRows} Lugares a la Base de Datos</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                importResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-bold">
                  {importResult.success ? '¡Importación Completada con Éxito!' : 'Error en la Importación'}
                </h4>
                <p className="text-xs mt-0.5 text-slate-300">{importResult.message}</p>
                {importResult.meta && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span>Destino: <strong>{importResult.meta.storage}</strong></span>
                    <span>•</span>
                    <span>Procesados: <strong>{importResult.meta.processedCount}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Preview Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[380px] scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold z-10">
                  <tr>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">ID Slug</th>
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="py-2.5 px-3">Comuna/Zona</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Prioridad</th>
                    <th className="py-2.5 px-3">Origen</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3">Menú/Perfil</th>
                    <th className="py-2.5 px-3">Coordenadas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                  {filteredDisplayRows.map((item, i) => {
                    const l = item.lugar;
                    const hasWarn = item.warnings.length > 0;
                    const isP1 = l.prioridad === 1 || l.origen === 'ubicame_cc';

                    return (
                      <tr
                        key={l.id_slug + i}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isP1 ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {hasWarn ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                              title={item.warnings.join(' | ')}
                            >
                              <AlertTriangle size={11} />
                              <span>Alerta</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 size={11} />
                              <span>OK</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-300 whitespace-nowrap">
                          {l.id_slug}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-white whitespace-nowrap">
                          {l.nombre}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300 font-sans whitespace-nowrap">
                          {l.zona}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans whitespace-nowrap">
                          {l.tipo}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isP1 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10.5px] font-bold">
                              ★ P1
                            </span>
                          ) : (
                            <span className="text-slate-400">P{l.prioridad}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                          {l.origen}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-emerald-400">
                          {l.whatsapp || '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 truncate max-w-[120px]">
                          {l.url_perfil || '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[10.5px]">
                          {l.latitud.toFixed(4)}, {l.longitud.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchExcelUploader;
