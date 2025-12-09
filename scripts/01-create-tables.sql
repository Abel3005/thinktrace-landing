-- CodeTracker v4.0 - Git-Optimized PostgreSQL Schema for Supabase
-- Backward compatible with existing client API while optimized for Git-style export

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    organization VARCHAR(200),
    api_key VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================================
-- REPOSITORIES TABLE (compatible with "projects" API)
-- ============================================================================
CREATE TABLE repositories (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repo_name)
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);

-- ============================================================================
-- FILE CONTENTS (deduplicated storage)
-- ============================================================================
CREATE TABLE file_contents (
    id SERIAL PRIMARY KEY,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    content BYTEA NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_file_contents_hash ON file_contents(content_hash);

-- ============================================================================
-- COMMITS TABLE (unified snapshots + AI interactions)
-- ============================================================================
CREATE TABLE commits (
    id SERIAL PRIMARY KEY,
    repo_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    commit_hash VARCHAR(64) UNIQUE NOT NULL,
    short_hash VARCHAR(7) NOT NULL,
    committed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prompt_text TEXT,
    claude_session_id VARCHAR(100),
    parent_commit_id INTEGER REFERENCES commits(id) ON DELETE SET NULL,
    files_changed INTEGER DEFAULT 0,
    insertions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commits_repo_id ON commits(repo_id);
CREATE INDEX idx_commits_user_id ON commits(user_id);
CREATE INDEX idx_commits_hash ON commits(commit_hash);
CREATE INDEX idx_commits_committed_at ON commits(committed_at);
CREATE INDEX idx_commits_parent ON commits(parent_commit_id);
CREATE INDEX idx_commits_session ON commits(claude_session_id);

-- ============================================================================
-- COMMIT FILES (file changes within commits)
-- ============================================================================
CREATE TABLE commit_files (
    id SERIAL PRIMARY KEY,
    commit_id INTEGER NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    change_type CHAR(1) NOT NULL CHECK (change_type IN ('A', 'M', 'D')),
    pre_content_id INTEGER REFERENCES file_contents(id) ON DELETE SET NULL,
    post_content_id INTEGER REFERENCES file_contents(id) ON DELETE SET NULL,
    lines_added INTEGER DEFAULT 0,
    lines_removed INTEGER DEFAULT 0,
    unified_diff TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commit_files_commit_id ON commit_files(commit_id);
CREATE INDEX idx_commit_files_file_path ON commit_files(file_path);
CREATE INDEX idx_commit_files_pre_content ON commit_files(pre_content_id);
CREATE INDEX idx_commit_files_post_content ON commit_files(post_content_id);

-- ============================================================================
-- AI INTERACTIONS TABLE (links pre/post commits)
-- ============================================================================
CREATE TABLE ai_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repo_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    pre_commit_id INTEGER NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    post_commit_id INTEGER NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    claude_session_id VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    files_modified INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_repo_id ON ai_interactions(repo_id);
CREATE INDEX idx_ai_interactions_pre_commit ON ai_interactions(pre_commit_id);
CREATE INDEX idx_ai_interactions_post_commit ON ai_interactions(post_commit_id);
CREATE INDEX idx_ai_interactions_session ON ai_interactions(claude_session_id);

-- ============================================================================
-- VIEWS FOR STATISTICS
-- ============================================================================
CREATE VIEW user_statistics AS
SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT r.id) AS total_projects,
    COUNT(DISTINCT c.id) AS total_snapshots,
    COUNT(DISTINCT ai.id) AS total_interactions,
    COALESCE(SUM(c.files_changed), 0) AS total_files_changed,
    COALESCE(SUM(c.insertions), 0) AS total_insertions,
    COALESCE(SUM(c.deletions), 0) AS total_deletions,
    COUNT(DISTINCT CASE WHEN c.prompt_text IS NOT NULL THEN c.id END) AS ai_generated_commits
FROM users u
LEFT JOIN repositories r ON u.id = r.user_id
LEFT JOIN commits c ON r.id = c.repo_id
LEFT JOIN ai_interactions ai ON r.id = ai.repo_id
GROUP BY u.id, u.username;

CREATE VIEW repository_statistics AS
SELECT
    r.id AS repo_id,
    r.repo_name,
    r.user_id,
    COUNT(DISTINCT c.id) AS total_commits,
    COUNT(DISTINCT ai.id) AS total_interactions,
    COALESCE(SUM(c.files_changed), 0) AS total_files_changed,
    COALESCE(SUM(c.insertions), 0) AS total_insertions,
    COALESCE(SUM(c.deletions), 0) AS total_deletions,
    MIN(c.committed_at) AS first_commit_at,
    MAX(c.committed_at) AS last_commit_at
FROM repositories r
LEFT JOIN commits c ON r.id = c.repo_id
LEFT JOIN ai_interactions ai ON r.id = ai.repo_id
GROUP BY r.id, r.repo_name, r.user_id;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_commit_hash(
    p_repo_id INTEGER,
    p_message TEXT,
    p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(
        digest(
            p_repo_id::TEXT ||
            COALESCE(p_message, '') ||
            p_timestamp::TEXT ||
            random()::TEXT,
            'sha1'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_commit_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.commit_hash IS NULL OR NEW.commit_hash = '' THEN
        NEW.commit_hash := generate_commit_hash(
            NEW.repo_id,
            NEW.message,
            COALESCE(NEW.committed_at, NOW())
        );
        NEW.short_hash := substring(NEW.commit_hash from 1 for 7);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_commit_hash_trigger
    BEFORE INSERT ON commits
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_commit_hash();

CREATE OR REPLACE FUNCTION update_commit_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE commits
    SET
        files_changed = (
            SELECT COUNT(*)
            FROM commit_files
            WHERE commit_id = NEW.commit_id
        ),
        insertions = (
            SELECT COALESCE(SUM(lines_added), 0)
            FROM commit_files
            WHERE commit_id = NEW.commit_id
        ),
        deletions = (
            SELECT COALESCE(SUM(lines_removed), 0)
            FROM commit_files
            WHERE commit_id = NEW.commit_id
        )
    WHERE id = NEW.commit_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commit_stats_trigger
    AFTER INSERT OR UPDATE ON commit_files
    FOR EACH ROW
    EXECUTE FUNCTION update_commit_statistics();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) for Supabase
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Repository policies
CREATE POLICY "Users can view own repositories" ON repositories
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own repositories" ON repositories
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own repositories" ON repositories
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own repositories" ON repositories
    FOR DELETE USING (user_id = auth.uid());

-- Commit policies
CREATE POLICY "Users can view own commits" ON commits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own commits" ON commits
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own commits" ON commits
    FOR UPDATE USING (user_id = auth.uid());

-- File contents (shared, deduplicated)
CREATE POLICY "Authenticated users can view file contents" ON file_contents
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert file contents" ON file_contents
    FOR INSERT TO authenticated WITH CHECK (true);

-- Commit files
CREATE POLICY "Users can view own commit files" ON commit_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM commits c
            WHERE c.id = commit_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own commit files" ON commit_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM commits c
            WHERE c.id = commit_id AND c.user_id = auth.uid()
        )
    );

-- AI interactions
CREATE POLICY "Users can view own interactions" ON ai_interactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own interactions" ON ai_interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());
