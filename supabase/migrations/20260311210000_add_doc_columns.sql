-- Add doc_url column for uploaded document files
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshop_ideas' AND column_name = 'doc_url') THEN
    ALTER TABLE workshop_ideas ADD COLUMN doc_url TEXT;
  END IF;
END $$;

-- Add doc_name column for original document filename
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workshop_ideas' AND column_name = 'doc_name') THEN
    ALTER TABLE workshop_ideas ADD COLUMN doc_name TEXT;
  END IF;
END $$;
