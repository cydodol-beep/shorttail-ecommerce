/**
 * Add RLS policies for temp_custdata table
 */

-- Enable RLS
ALTER TABLE temp_custdata ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users with admin roles to access the table
CREATE POLICY "Allow admin users to access temp_custdata"
ON temp_custdata
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'master_admin' OR profiles.role = 'normal_admin')
  )
);

-- Add comment to document the policy
COMMENT ON POLICY "Allow admin users to access temp_custdata" 
ON temp_custdata IS 'Allow users with master_admin or normal_admin roles to access temp_custdata table';