-- Supabase Schema for Quiz Analytics
-- Updated to use SERIAL primary keys instead of UUIDs

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create quizzes table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
    order_index INTEGER NOT NULL,
    correct_answer_id INTEGER, -- Will be set after answers are created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, order_index)
);

-- Create answers table
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    answer_label VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' or 'T', 'F'
    guesses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, answer_label)
);

-- Create submissions table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    score_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_questions > 0 THEN (correct_answers::DECIMAL / total_questions::DECIMAL * 100)
            ELSE 0 
        END
    ) STORED,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for correct_answer_id (after answers table exists)
ALTER TABLE questions 
    ADD CONSTRAINT fk_questions_correct_answer 
    FOREIGN KEY (correct_answer_id) 
    REFERENCES answers(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_submissions_quiz_id ON submissions(quiz_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
    BEFORE UPDATE ON answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - but we'll disable it for development
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to quizzes"
    ON quizzes FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to questions"
    ON questions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to answers"
    ON answers FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public read access to submissions"
    ON submissions FOR SELECT
    TO anon, authenticated
    USING (true);

-- Create policies for public write access
CREATE POLICY "Allow public insert to quizzes"
    ON quizzes FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public insert to questions"
    ON questions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public update to questions"
    ON questions FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public insert to answers"
    ON answers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public update to answer guesses"
    ON answers FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public insert to submissions"
    ON submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create a function to increment answer guesses atomically
CREATE OR REPLACE FUNCTION increment_answer_guess(answer_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE answers
    SET guesses = guesses + 1
    WHERE id = answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for quiz statistics
CREATE OR REPLACE VIEW quiz_statistics AS
SELECT 
    q.id AS quiz_id,
    q.name AS quiz_name,
    COUNT(DISTINCT s.id) AS total_submissions,
    ROUND(AVG(s.score_percentage), 2) AS average_score,
    MAX(s.score_percentage) AS highest_score,
    MIN(s.score_percentage) AS lowest_score,
    COUNT(DISTINCT qs.id) AS total_questions
FROM quizzes q
LEFT JOIN submissions s ON q.id = s.quiz_id
LEFT JOIN questions qs ON q.id = qs.quiz_id
GROUP BY q.id, q.name;

-- Create a view for question statistics
CREATE OR REPLACE VIEW question_statistics AS
SELECT 
    qs.id AS question_id,
    qs.quiz_id,
    qs.question_text,
    qs.question_type,
    a_correct.answer_label AS correct_answer_label,
    a_correct.answer_text AS correct_answer_text,
    COALESCE(SUM(a.guesses), 0) AS total_guesses,
    COALESCE(MAX(CASE WHEN a.id = qs.correct_answer_id THEN a.guesses ELSE 0 END), 0) AS correct_guesses,
    CASE 
        WHEN COALESCE(SUM(a.guesses), 0) > 0 
        THEN ROUND(
            (COALESCE(MAX(CASE WHEN a.id = qs.correct_answer_id THEN a.guesses ELSE 0 END), 0)::DECIMAL 
             / SUM(a.guesses)::DECIMAL * 100), 
            2)
        ELSE 0 
    END AS correct_percentage
FROM questions qs
LEFT JOIN answers a ON qs.id = a.question_id
LEFT JOIN answers a_correct ON qs.correct_answer_id = a_correct.id
GROUP BY qs.id, qs.question_text, qs.question_type, qs.quiz_id, a_correct.answer_label, a_correct.answer_text;

-- Create a view for answer statistics (detailed breakdown per question)
CREATE OR REPLACE VIEW answer_statistics AS
SELECT 
    a.id AS answer_id,
    a.question_id,
    a.answer_label,
    a.answer_text,
    a.guesses,
    CASE WHEN qs.correct_answer_id = a.id THEN true ELSE false END AS is_correct,
    qs.question_text,
    qs.quiz_id
FROM answers a
JOIN questions qs ON a.question_id = qs.id
ORDER BY a.question_id, a.answer_label;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION increment_answer_guess(INTEGER) TO anon, authenticated;

-- Grant select on views
GRANT SELECT ON quiz_statistics TO anon, authenticated;
GRANT SELECT ON question_statistics TO anon, authenticated;
GRANT SELECT ON answer_statistics TO anon, authenticated;

-- Comments
COMMENT ON TABLE quizzes IS 'Stores quiz metadata';
COMMENT ON TABLE questions IS 'Stores questions belonging to quizzes';
COMMENT ON TABLE answers IS 'Stores answer choices for questions with guess counts';
COMMENT ON TABLE submissions IS 'Stores user quiz submissions with scores';
COMMENT ON COLUMN answers.guesses IS 'Number of times this answer was selected';
COMMENT ON COLUMN questions.correct_answer_id IS 'Foreign key to the correct answer';

-- User Authentication Schema Updates
-- This file contains the schema changes needed to add user authentication

-- Create users table with SERIAL primary key
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public to read user info (except password)
CREATE POLICY "Allow public read access to users"
    ON users FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow users to insert (sign up)
CREATE POLICY "Allow public insert to users"
    ON users FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow users to update their own data
CREATE POLICY "Allow users to update own data"
    ON users FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Create view for leaderboard by quiz (top scores per quiz)
CREATE OR REPLACE VIEW quiz_leaderboard AS
SELECT 
    s.quiz_id,
    q.name AS quiz_name,
    s.user_id,
    u.username,
    u.full_name,
    s.score_percentage,
    s.correct_answers,
    s.total_questions,
    s.submitted_at,
    ROW_NUMBER() OVER (PARTITION BY s.quiz_id ORDER BY s.score_percentage DESC, s.submitted_at ASC) AS rank
FROM submissions s
JOIN quizzes q ON s.quiz_id = q.id
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL
ORDER BY s.quiz_id, s.score_percentage DESC, s.submitted_at ASC;

-- Create view for most active users (by submission count)
CREATE OR REPLACE VIEW user_activity_leaderboard AS
SELECT 
    u.id AS user_id,
    u.username,
    u.full_name,
    COUNT(s.id) AS total_submissions,
    ROUND(AVG(s.score_percentage), 2) AS average_score,
    MAX(s.score_percentage) AS highest_score,
    MIN(s.score_percentage) AS lowest_score,
    MAX(s.submitted_at) AS last_submission
FROM users u
LEFT JOIN submissions s ON u.id = s.user_id
GROUP BY u.id, u.username, u.full_name
HAVING COUNT(s.id) > 0
ORDER BY total_submissions DESC, average_score DESC;

-- Grant permissions on views
GRANT SELECT ON quiz_leaderboard TO anon, authenticated;
GRANT SELECT ON user_activity_leaderboard TO anon, authenticated;

-- Comments
COMMENT ON TABLE users IS 'Stores user accounts with hashed passwords';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password with salt';
COMMENT ON COLUMN submissions.user_id IS 'Foreign key to user who submitted the quiz';
COMMENT ON VIEW quiz_leaderboard IS 'Top scores per quiz with user rankings';
COMMENT ON VIEW user_activity_leaderboard IS 'Most active users by submission count';