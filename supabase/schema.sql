-- Supabase Schema for Quiz Analytics
-- Updated to use SERIAL primary keys instead of UUIDs

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

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
GROUP BY qs.id, qs.question_text, qs.question_type, qs.quiz_id;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION increment_answer_guess(INTEGER) TO anon, authenticated;

-- Grant select on views
GRANT SELECT ON quiz_statistics TO anon, authenticated;
GRANT SELECT ON question_statistics TO anon, authenticated;

-- Comments
COMMENT ON TABLE quizzes IS 'Stores quiz metadata';
COMMENT ON TABLE questions IS 'Stores questions belonging to quizzes';
COMMENT ON TABLE answers IS 'Stores answer choices for questions with guess counts';
COMMENT ON TABLE submissions IS 'Stores user quiz submissions with scores';
COMMENT ON COLUMN answers.guesses IS 'Number of times this answer was selected';
COMMENT ON COLUMN questions.correct_answer_id IS 'Foreign key to the correct answer';