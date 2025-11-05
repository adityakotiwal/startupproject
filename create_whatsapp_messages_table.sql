-- Fix whatsapp_messages table schema
-- Add missing columns if they don't exist

-- Add message column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN message text;
  END IF;
END $$;

-- Add phone column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'phone'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN phone varchar(20);
  END IF;
END $$;

-- Add status column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'status'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN status varchar(20);
  END IF;
END $$;

-- Add message_type column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN message_type varchar(50);
  END IF;
END $$;

-- Add metadata column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- Add sent_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN sent_at timestamp with time zone;
  END IF;
END $$;
