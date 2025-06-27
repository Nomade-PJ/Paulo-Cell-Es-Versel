-- Habilitar RLS (Row Level Security) para as tabelas se ainda não estiver habilitado
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_status_views ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso público de leitura para serviços via public_tracking_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'services' AND policyname = 'public_read_by_tracking_id'
  ) THEN
    CREATE POLICY public_read_by_tracking_id ON services
      FOR SELECT 
      TO anon
      USING (public_tracking_id IS NOT NULL);
    
    RAISE NOTICE 'Política de acesso público para leitura de serviços criada';
  ELSE
    RAISE NOTICE 'Política de acesso público para leitura de serviços já existe';
  END IF;
END $$;

-- Criar política para permitir inserção de registros de visualização sem autenticação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'service_status_views' AND policyname = 'public_insert_views'
  ) THEN
    CREATE POLICY public_insert_views ON service_status_views
      FOR INSERT 
      TO anon
      WITH CHECK (true);
    
    RAISE NOTICE 'Política de inserção pública para visualizações de serviço criada';
  ELSE
    RAISE NOTICE 'Política de inserção pública para visualizações de serviço já existe';
  END IF;
END $$;

-- Conceder permissões necessárias ao usuário anônimo
GRANT SELECT ON services TO anon;
GRANT INSERT ON service_status_views TO anon; 