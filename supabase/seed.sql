-- Updated Supabase Seed Data with Random User IDs
-- This file populates the database with sample quiz data
-- and assigns random user IDs (1-1000) to submissions

-- Insert sample quizzes (IDs will be auto-generated starting from 1)
INSERT INTO quizzes (name, description) VALUES
    ('General Knowledge Quiz', 'Test your general knowledge across various topics'),
    ('Science Quiz', 'Questions about science and technology');

-- Note: After these inserts, quizzes will have IDs 1 and 2

-- Insert questions for General Knowledge Quiz (quiz_id = 1)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    -- Multiple Choice Questions
    (1, 'What is the capital of France?', 'multiple_choice', 1),
    (1, 'What is 2 + 2?', 'multiple_choice', 2),
    (1, 'Which planet is closest to the Sun?', 'multiple_choice', 3),
    -- True/False Questions
    (1, 'The Earth is flat.', 'true_false', 4),
    (1, 'Water boils at 100°C at sea level.', 'true_false', 5);

-- Insert questions for Science Quiz (quiz_id = 2)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (2, 'What is the chemical symbol for water?', 'multiple_choice', 1),
    (2, 'Light travels faster than sound.', 'true_false', 2);

-- Note: After these inserts, questions will have IDs 1-7

-- Insert answers for Question 1: "What is the capital of France?"
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (1, 'London', 'A', 5),
    (1, 'Paris', 'B', 45),
    (1, 'Berlin', 'C', 3),
    (1, 'Madrid', 'D', 2);

-- Insert answers for Question 2: "What is 2 + 2?"
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (2, '3', 'A', 2),
    (2, '4', 'B', 48),
    (2, '5', 'C', 4),
    (2, '6', 'D', 1);

-- Insert answers for Question 3: "Which planet is closest to the Sun?"
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (3, 'Venus', 'A', 8),
    (3, 'Earth', 'B', 3),
    (3, 'Mercury', 'C', 38),
    (3, 'Mars', 'D', 6);

-- Insert answers for Question 4: "The Earth is flat."
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (4, 'True', 'T', 2),
    (4, 'False', 'F', 53);

-- Insert answers for Question 5: "Water boils at 100°C at sea level."
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (5, 'True', 'T', 50),
    (5, 'False', 'F', 5);

-- Insert answers for Question 6: "What is the chemical symbol for water?"
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (6, 'H2O', 'A', 28),
    (6, 'CO2', 'B', 1),
    (6, 'O2', 'C', 2),
    (6, 'H2', 'D', 1);

-- Insert answers for Question 7: "Light travels faster than sound."
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (7, 'True', 'T', 31),
    (7, 'False', 'F', 1);

-- Note: Answers will have IDs 1-24 (4+4+4+2+2+4+2)

-- Update questions with correct answer IDs
UPDATE questions SET correct_answer_id = 2 WHERE id = 1;   -- Question 1: Paris
UPDATE questions SET correct_answer_id = 6 WHERE id = 2;   -- Question 2: 4
UPDATE questions SET correct_answer_id = 11 WHERE id = 3;  -- Question 3: Mercury
UPDATE questions SET correct_answer_id = 14 WHERE id = 4;  -- Question 4: False
UPDATE questions SET correct_answer_id = 15 WHERE id = 5;  -- Question 5: True
UPDATE questions SET correct_answer_id = 17 WHERE id = 6;  -- Question 6: H2O
UPDATE questions SET correct_answer_id = 21 WHERE id = 7;  -- Question 7: True

-- ==========================================
-- UPDATED: Insert sample submissions with random user_ids (1-1000)
-- ==========================================

-- General Knowledge Quiz submissions (quiz_id = 1) - 50 submissions
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Perfect scores
    (1, 42, 5, 5),
    (1, 137, 5, 5),
    (1, 256, 5, 5),
    (1, 389, 5, 5),
    (1, 512, 5, 5),
    (1, 675, 5, 5),
    (1, 788, 5, 5),
    (1, 891, 5, 5),
    (1, 934, 5, 5),
    (1, 999, 5, 5),
    
    -- 4/5 scores
    (1, 15, 4, 5),
    (1, 123, 4, 5),
    (1, 267, 4, 5),
    (1, 345, 4, 5),
    (1, 456, 4, 5),
    (1, 567, 4, 5),
    (1, 678, 4, 5),
    (1, 789, 4, 5),
    (1, 823, 4, 5),
    (1, 912, 4, 5),
    (1, 201, 4, 5),
    (1, 334, 4, 5),
    (1, 445, 4, 5),
    (1, 556, 4, 5),
    (1, 667, 4, 5),
    
    -- 3/5 scores
    (1, 78, 3, 5),
    (1, 189, 3, 5),
    (1, 298, 3, 5),
    (1, 401, 3, 5),
    (1, 523, 3, 5),
    (1, 634, 3, 5),
    (1, 745, 3, 5),
    (1, 856, 3, 5),
    (1, 967, 3, 5),
    (1, 111, 3, 5),
    (1, 222, 3, 5),
    (1, 333, 3, 5),
    (1, 444, 3, 5),
    (1, 555, 3, 5),
    (1, 666, 3, 5),
    
    -- 2/5 scores
    (1, 90, 2, 5),
    (1, 145, 2, 5),
    (1, 278, 2, 5),
    (1, 367, 2, 5),
    (1, 489, 2, 5),
    (1, 590, 2, 5),
    (1, 701, 2, 5),
    (1, 812, 2, 5),
    (1, 923, 2, 5),
    (1, 105, 2, 5);

-- Science Quiz submissions (quiz_id = 2) - 30 submissions
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Perfect scores (2/2)
    (2, 50, 2, 2),
    (2, 151, 2, 2),
    (2, 252, 2, 2),
    (2, 353, 2, 2),
    (2, 454, 2, 2),
    (2, 555, 2, 2),
    (2, 656, 2, 2),
    (2, 757, 2, 2),
    (2, 858, 2, 2),
    (2, 959, 2, 2),
    (2, 100, 2, 2),
    (2, 200, 2, 2),
    (2, 300, 2, 2),
    (2, 400, 2, 2),
    (2, 500, 2, 2),
    
    -- 1/2 scores
    (2, 77, 1, 2),
    (2, 178, 1, 2),
    (2, 279, 1, 2),
    (2, 380, 1, 2),
    (2, 481, 1, 2),
    (2, 582, 1, 2),
    (2, 683, 1, 2),
    (2, 784, 1, 2),
    (2, 885, 1, 2),
    (2, 986, 1, 2),
    
    -- 0/2 scores (rare)
    (2, 25, 0, 2),
    (2, 126, 0, 2),
    (2, 227, 0, 2),
    (2, 328, 0, 2),
    (2, 429, 0, 2);

-- Additional diverse submissions for both quizzes
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- More General Knowledge Quiz submissions
    (1, 750, 5, 5),
    (1, 820, 4, 5),
    (1, 930, 3, 5),
    (1, 560, 4, 5),
    (1, 670, 3, 5),
    (1, 780, 5, 5),
    (1, 890, 2, 5),
    (1, 95, 4, 5),
    (1, 185, 3, 5),
    (1, 275, 5, 5),
    
    -- More Science Quiz submissions
    (2, 630, 2, 2),
    (2, 740, 1, 2),
    (2, 850, 2, 2),
    (2, 960, 1, 2),
    (2, 70, 2, 2),
    (2, 170, 1, 2),
    (2, 270, 2, 2),
    (2, 370, 0, 2),
    (2, 470, 2, 2),
    (2, 570, 1, 2);

-- Verify the data
SELECT 
    q.name,
    COUNT(DISTINCT qs.id) AS total_questions,
    COUNT(DISTINCT a.id) AS total_answers,
    COUNT(DISTINCT s.id) AS total_submissions,
    COUNT(DISTINCT s.user_id) AS unique_users
FROM quizzes q
LEFT JOIN questions qs ON q.id = qs.quiz_id
LEFT JOIN answers a ON qs.id = a.question_id
LEFT JOIN submissions s ON q.id = s.quiz_id
GROUP BY q.id, q.name
ORDER BY q.id;

-- Show submission summary by quiz
SELECT 
    q.name AS quiz_name,
    COUNT(s.id) AS total_submissions,
    COUNT(DISTINCT s.user_id) AS unique_users,
    AVG(s.score_percentage) AS avg_score,
    MAX(s.score_percentage) AS max_score,
    MIN(s.score_percentage) AS min_score
FROM quizzes q
LEFT JOIN submissions s ON q.id = s.quiz_id
GROUP BY q.id, q.name
ORDER BY q.id;

-- Show quiz leaderboard preview (top 5 for each quiz)
SELECT 
    rank,
    username,
    full_name,
    quiz_name,
    correct_answers,
    total_questions,
    score_percentage,
    submitted_at
FROM quiz_leaderboard
WHERE rank <= 5
ORDER BY quiz_id, rank;

-- Show user activity leaderboard preview (top 10)
SELECT 
    rank,
    username,
    full_name,
    total_submissions,
    average_score,
    highest_score
FROM user_activity_leaderboard
WHERE rank <= 10
ORDER BY rank;