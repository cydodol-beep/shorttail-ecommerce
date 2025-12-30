-- Add custom_order_id column to orders table to store formatted order IDs
ALTER TABLE public.orders 
ADD COLUMN custom_order_id TEXT UNIQUE;

-- Create function to generate custom order ID based on source
CREATE OR REPLACE FUNCTION generate_custom_order_id(order_source_param TEXT)
RETURNS TEXT AS $$
DECLARE
    current_date_str TEXT;
    sequence_number INTEGER;
    custom_id TEXT;
BEGIN
    -- Format: YYYYMMDD (e.g., 20260115)
    current_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get next sequence number for the day
    SELECT COALESCE(MAX(CAST(SUBSTRING(custom_order_id FROM LENGTH(custom_order_id) - 3) AS INTEGER)), 0) + 1
    INTO sequence_number
    FROM public.orders
    WHERE custom_order_id LIKE 
        CASE 
            WHEN order_source_param = 'pos' THEN 'POSST' || current_date_str || '%'
            ELSE 'MKSTP' || current_date_str || '%'
        END;
    
    -- Generate the custom ID
    custom_id := 
        CASE 
            WHEN order_source_param = 'pos' THEN 'POSST'
            ELSE 'MKSTP'
        END || current_date_str || LPAD(sequence_number::TEXT, 4, '0');
    
    RETURN custom_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-generate custom_order_id before insert
CREATE OR REPLACE FUNCTION set_custom_order_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set custom_order_id if it's not already set
    IF NEW.custom_order_id IS NULL THEN
        NEW.custom_order_id := generate_custom_order_id(NEW.source);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set custom_order_id before insert
CREATE TRIGGER set_custom_order_id_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION set_custom_order_id();

-- Update existing orders to have custom_order_id
-- For POS orders
UPDATE public.orders 
SET custom_order_id = generate_custom_order_id('pos')
WHERE source = 'pos' AND custom_order_id IS NULL;

-- For marketplace orders
UPDATE public.orders 
SET custom_order_id = generate_custom_order_id('marketplace')
WHERE source = 'marketplace' AND custom_order_id IS NULL;