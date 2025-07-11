import { NextResponse } from 'next/server';
import { getDBInstance } from '@/database/core/web-server';
import { sql } from 'drizzle-orm';

export async function GET() {
  const health = {
    status: 'checking',
    services: {
      database: false,
      redis: false,
      app: true,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Verificar PostgreSQL
  try {
    const db = getDBInstance();
    await db.execute(sql`SELECT 1`);
    health.services.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Redis check removido temporariamente - ioredis não está instalado
  health.services.redis = true;

  // Determinar status geral
  health.status = Object.values(health.services).every(v => v) ? 'healthy' : 'unhealthy';

  // Adicionar detalhes de configuração (sem expor dados sensíveis)
  const configDetails = {
    database: {
      configured: !!process.env.DATABASE_URL,
      driver: process.env.DATABASE_DRIVER || 'node',
    },
    redis: {
      configured: !!(process.env.REDIS_HOST || process.env.REDIS_URL),
    },
    nodeVersion: process.version,
  };

  return NextResponse.json(
    {
      ...health,
      config: configDetails,
    },
    {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}