-- Verificar se a extensão uuid-ossp está disponível
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se a coluna public_tracking_id existe na tabela services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'services'
    AND column_name = 'public_tracking_id'
  ) THEN
    -- Adicionar a coluna se não existir
    ALTER TABLE services ADD COLUMN public_tracking_id UUID DEFAULT uuid_generate_v4();
    RAISE NOTICE 'Coluna public_tracking_id adicionada à tabela services';
  ELSE
    RAISE NOTICE 'Coluna public_tracking_id já existe na tabela services';
  END IF;
END $$;

-- Verificar se a coluna public_notes existe na tabela services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'services'
    AND column_name = 'public_notes'
  ) THEN
    -- Adicionar a coluna se não existir
    ALTER TABLE services ADD COLUMN public_notes TEXT;
    RAISE NOTICE 'Coluna public_notes adicionada à tabela services';
  ELSE
    RAISE NOTICE 'Coluna public_notes já existe na tabela services';
  END IF;
END $$;

-- Criar índice para consultas mais rápidas (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_services_public_tracking_id'
  ) THEN
    CREATE INDEX idx_services_public_tracking_id ON services(public_tracking_id);
    RAISE NOTICE 'Índice idx_services_public_tracking_id criado';
  ELSE
    RAISE NOTICE 'Índice idx_services_public_tracking_id já existe';
  END IF;
END $$;

-- Verificar e criar a tabela service_status_views se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'service_status_views'
  ) THEN
    CREATE TABLE service_status_views (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
UPDATE services 
SET public_tracking_id = uuid_generate_v4() 
WHERE public_tracking_id IS NULL;

-- Exibir serviços sem public_tracking_id (verificação final)
SELECT COUNT(*) AS services_without_tracking_id
FROM services
WHERE public_tracking_id IS NULL;

-- Exibir total de serviços com public_tracking_id (verificação final)
SELECT COUNT(*) AS services_with_tracking_id
FROM services
WHERE public_tracking_id IS NOT NULL; 