-- Supabase Seed Data
-- Updated to use SERIAL primary keys instead of UUIDs
-- This file populates the database with sample quiz data

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
-- Question 1: Paris (answer_id = 2)
UPDATE questions SET correct_answer_id = 2 WHERE id = 1;

-- Question 2: 4 (answer_id = 6)
UPDATE questions SET correct_answer_id = 6 WHERE id = 2;

-- Question 3: Mercury (answer_id = 11)
UPDATE questions SET correct_answer_id = 11 WHERE id = 3;

-- Question 4: False (answer_id = 14)
UPDATE questions SET correct_answer_id = 14 WHERE id = 4;

-- Question 5: True (answer_id = 15)
UPDATE questions SET correct_answer_id = 15 WHERE id = 5;

-- Question 6: H2O (answer_id = 17)
UPDATE questions SET correct_answer_id = 17 WHERE id = 6;

-- Question 7: True (answer_id = 23)
UPDATE questions SET correct_answer_id = 23 WHERE id = 7;

-- Insert sample submissions
INSERT INTO submissions (quiz_id, correct_answers, total_questions) VALUES
    (1, 5, 5),
    (1, 4, 5),
    (1, 3, 5),
    (1, 5, 5),
    (1, 4, 5),
    (2, 2, 2),
    (2, 1, 2),
    (2, 2, 2);

-- Verify the data
SELECT 
    q.name,
    COUNT(DISTINCT qs.id) AS total_questions,
    COUNT(DISTINCT a.id) AS total_answers,
    COUNT(DISTINCT s.id) AS total_submissions
FROM quizzes q
LEFT JOIN questions qs ON q.id = qs.quiz_id
LEFT JOIN answers a ON qs.id = a.question_id
LEFT JOIN submissions s ON q.id = s.quiz_id
GROUP BY q.id, q.name
ORDER BY q.id;

-- Additional verification queries
SELECT 'Quizzes' as table_name, COUNT(*) as count FROM quizzes
UNION ALL
SELECT 'Questions', COUNT(*) FROM questions
UNION ALL
SELECT 'Answers', COUNT(*) FROM answers
UNION ALL
SELECT 'Submissions', COUNT(*) FROM submissions;

-- Show quiz details with correct answers
SELECT 
    q.name AS quiz_name,
    qs.order_index,
    qs.question_text,
    qs.question_type,
    a.answer_text AS correct_answer,
    a.answer_label AS correct_label
FROM quizzes q
JOIN questions qs ON q.id = qs.quiz_id
LEFT JOIN answers a ON qs.correct_answer_id = a.id
ORDER BY q.id, qs.order_index;