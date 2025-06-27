-- Adicionar campos para tracking público na tabela services
ALTER TABLE services ADD COLUMN IF NOT EXISTS public_tracking_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE services ADD COLUMN IF NOT EXISTS public_notes TEXT;

-- Criar índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_services_public_tracking_id ON services(public_tracking_id);

-- Verificar e criar a tabela service_status_views se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'service_status_views'
  ) THEN
    -- Garantir que a extensão uuid-ossp está habilitada
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Criar a tabela com UUID em vez de sequência
    CREATE TABLE service_status_views (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Usa UUID com função uuid_generate_v4()
      service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      client_ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    CREATE INDEX idx_service_status_views_service_id ON service_status_views(service_id);
    CREATE INDEX idx_service_status_views_viewed_at ON service_status_views(viewed_at);
    
    RAISE NOTICE 'Tabela service_status_views criada com seus índices';
  ELSE
    RAISE NOTICE 'Tabela service_status_views já existe';
  END IF;
END $$;

-- Preencher UUIDs para registros existentes que não têm
UPDATE services SET public_tracking_id = uuid_generate_v4() WHERE public_tracking_id IS NULL; 