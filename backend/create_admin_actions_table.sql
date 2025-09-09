-- Create admin_actions table for tracking administrative actions
CREATE TABLE IF NOT EXISTS admin_actions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR,
    admin_id VARCHAR(36) NOT NULL,
    target_user_id VARCHAR(36),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);