/**
 * Add RLS policies for temp_custdata table
 */

-- Enable RLS
ALTER TABLE temp_custdata ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (for re-running migration)
DROP POLICY IF EXISTS "Allow admin users to access temp_custdata" ON temp_custdata;
DROP POLICY IF EXISTS "Allow admin users to select temp_custdata" ON temp_custdata;
DROP POLICY IF EXISTS "Allow admin users to insert temp_custdata" ON temp_custdata;
DROP POLICY IF EXISTS "Allow admin users to update temp_custdata" ON temp_custdata;
DROP POLICY IF EXISTS "Allow admin users to delete temp_custdata" ON temp_custdata;

-- Create separate policies for each operation for better control

-- SELECT policy
CREATE POLICY "Allow admin users to select temp_custdata"
ON temp_custdata
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
);

-- INSERT policy
CREATE POLICY "Allow admin users to insert temp_custdata"
ON temp_custdata
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
);

-- UPDATE policy
CREATE POLICY "Allow admin users to update temp_custdata"
ON temp_custdata
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
);

-- DELETE policy
CREATE POLICY "Allow admin users to delete temp_custdata"
ON temp_custdata
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
);

-- Add comments to document the policies
COMMENT ON TABLE temp_custdata IS 'Temporary table for customer data import/export operations. Only accessible by admin users.';