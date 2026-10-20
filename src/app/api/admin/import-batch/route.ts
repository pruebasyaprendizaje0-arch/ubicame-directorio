import { NextRequest, NextResponse } from 'next/server';
import { Lugar } from '@/types/lugar';
import fs from 'fs';
import path from 'path';

/**
 * Endpoint Super Admin: Importación masiva por lotes (Batch UPSERT)
 * POST /api/admin/import-batch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lugares: Lugar[] = body.lugares;

    if (!lugares || !Array.isArray(lugares) || lugares.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se recibieron registros válidos para importar' },
        { status: 400 }
      );
    }

    const hasPostgres = Boolean(
      process.env.DATABASE_URL && process.env.USE_LOCAL_DATA !== 'true'
    );

    let processedCount = 0;
    let chunksCount = 0;
    const errors: string[] = [];

    if (hasPostgres) {
      // 1. Inserción directa en PostgreSQL mediante transacciones y chunks de 50
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      });

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const chunkSize = 50;
        for (let i = 0; i < lugares.length; i += chunkSize) {
          const chunk = lugares.slice(i, i + chunkSize);
          chunksCount++;

          for (const item of chunk) {
            const query = `
              INSERT INTO lugares (
                id_slug, nombre, tipo, icono, provincia, ciudad, zona,
                latitud, longitud, es_referencia, es_servicio, prioridad,
                origen, whatsapp, url_perfil, estado, descripcion, foto_url
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18
              )
              ON CONFLICT (id_slug) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                tipo = EXCLUDED.tipo,
                icono = EXCLUDED.icono,
                provincia = EXCLUDED.provincia,
                ciudad = EXCLUDED.ciudad,
                zona = EXCLUDED.zona,
                latitud = EXCLUDED.latitud,
                longitud = EXCLUDED.longitud,
                es_referencia = EXCLUDED.es_referencia,
                es_servicio = EXCLUDED.es_servicio,
                prioridad = EXCLUDED.prioridad,
                origen = EXCLUDED.origen,
                whatsapp = EXCLUDED.whatsapp,
                url_perfil = EXCLUDED.url_perfil,
                estado = EXCLUDED.estado,
                descripcion = EXCLUDED.descripcion,
                foto_url = EXCLUDED.foto_url;
            `;

            const values = [
              item.id_slug,
              item.nombre,
              item.tipo,
              item.icono || 'lugar.svg',
              item.provincia || 'Santa Elena',
              item.ciudad || 'Santa Elena',
              item.zona || 'Olón',
              typeof item.latitud === 'number' && !isNaN(item.latitud) ? item.latitud : null,
              typeof item.longitud === 'number' && !isNaN(item.longitud) ? item.longitud : null,
              Boolean(item.es_referencia),
              Boolean(item.es_servicio),
              Number(item.prioridad) || 3,
              item.origen === 'ubicame_cc' ? 'ubicame_cc' : 'directorio_info',
              item.whatsapp || null,
              item.url_perfil || null,
              item.estado === 'pendiente' ? 'pendiente' : 'activo',
              item.descripcion || null,
              item.foto_url || null,
            ];

            await client.query(query, values);
            processedCount++;
          }
        }

        await client.query('COMMIT');
      } catch (dbErr: any) {
        await client.query('ROLLBACK');
        console.error('Error durante transacción batch PostgreSQL:', dbErr);
        throw new Error(`Fallo en base de datos: ${dbErr.message}`);
      } finally {
        client.release();
      }
    } else {
      // 2. Modo Desarrollo Local: Persistir y actualizar src/data/lugares.json
      const filePath = path.join(process.cwd(), 'src', 'data', 'lugares.json');
      let currentLugares: Lugar[] = [];

      try {
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf-8');
          currentLugares = JSON.parse(fileData);
        }
      } catch (readErr) {
        console.warn('No se pudo leer archivo JSON local anterior:', readErr);
      }

      // Upsert local por id_slug
      const placesMap = new Map<string, Lugar>();
      currentLugares.forEach(p => placesMap.set(p.id_slug, p));

      for (const item of lugares) {
        placesMap.set(item.id_slug, {
          ...item,
          icono: item.icono || 'lugar.svg',
          provincia: item.provincia || 'Santa Elena',
          ciudad: item.ciudad || 'Santa Elena',
          zona: item.zona || 'General',
          prioridad: Number(item.prioridad) || 3,
          origen: item.origen === 'ubicame_cc' ? 'ubicame_cc' : 'directorio_info',
          estado: item.estado === 'pendiente' ? 'pendiente' : 'activo',
        });
        processedCount++;
      }

      const updatedList = Array.from(placesMap.values());
      fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2), 'utf-8');
      chunksCount = Math.ceil(lugares.length / 50);
    }

    return NextResponse.json({
      success: true,
      message: `Se importaron/actualizaron exitosamente ${processedCount} lugares en ${chunksCount} lote(s).`,
      meta: {
        totalReceived: lugares.length,
        processedCount,
        chunksCount,
        storage: hasPostgres ? 'PostgreSQL (ubicame.cc)' : 'Local JSON (src/data/lugares.json)',
        errors,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/admin/import-batch:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor durante la importación' },
      { status: 500 }
    );
  }
}
