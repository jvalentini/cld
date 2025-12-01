-- Updated Supabase Seed Data with 5 Quizzes and Controlled User Distributions
-- This file populates the database with sample quiz data
-- and specific user submission patterns across quizzes
--
-- This script is IDEMPOTENT - it can be run multiple times safely

-- ==========================================
-- CLEAR ALL DATA AND RESET SEQUENCES
-- ==========================================
-- Truncate tables in dependency order (children first) and reset ID sequences
TRUNCATE TABLE submissions RESTART IDENTITY CASCADE;
TRUNCATE TABLE answers RESTART IDENTITY CASCADE;
TRUNCATE TABLE questions RESTART IDENTITY CASCADE;
TRUNCATE TABLE quizzes RESTART IDENTITY CASCADE;

-- Note: We don't truncate users table to preserve user accounts
-- If you need to reset users too, uncomment the line below:
-- TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- ==========================================
-- QUIZ 1: AI Tools Survey (from output.json)
-- ==========================================
INSERT INTO quizzes (name, description) VALUES
    ('AI Tools Survey', 'Questions about AI tool usage and preferences');

-- Quiz 1 Questions (3 multiple choice)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (1, 'What color is the sky?', 'multiple_choice', 1),
    (1, 'Did you use AI tools in creating this solution?', 'multiple_choice', 2),
    (1, 'If so, which ones', 'multiple_choice', 3);

-- Quiz 1 Answers (question_id 1-3)
-- Q1: What color is the sky? (Correct: Blue = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (1, 'Blue', 'A', 78),
    (1, 'Purple', 'B', 5),
    (1, 'None of the above', 'C', 3),
    (1, 'It depends', 'D', 14);

-- Q2: Did you use AI tools? (Correct: Yes = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (2, 'Yes', 'A', 65),
    (2, 'No', 'B', 12),
    (2, 'A little', 'C', 18),
    (2, 'What are AI tools', 'D', 5);

-- Q3: Which ones? (Correct: Gemini = C, index 3 in 1-based)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (3, 'ChatGPT', 'A', 35),
    (3, 'Claude', 'B', 28),
    (3, 'Gemini', 'C', 25),
    (3, 'Other', 'D', 12);

-- ==========================================
-- QUIZ 2: Historical Facts (True/False only)
-- ==========================================
INSERT INTO quizzes (name, description) VALUES
    ('Historical Facts Quiz', 'Test your knowledge of world history with true or false questions');

-- Quiz 2 Questions (6 true/false)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (2, 'The Great Wall of China is visible from space with the naked eye.', 'true_false', 1),
    (2, 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.', 'true_false', 2),
    (2, 'Napoleon Bonaparte was unusually short for his time.', 'true_false', 3),
    (2, 'Vikings wore horned helmets in battle.', 'true_false', 4),
    (2, 'The Roman Empire fell in 476 AD.', 'true_false', 5),
    (2, 'Albert Einstein failed math in school.', 'true_false', 6);

-- Quiz 2 Answers (question_id 4-9)
-- Q4: Great Wall visible from space (False)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (4, 'True', 'T', 42),
    (4, 'False', 'F', 58);

-- Q5: Cleopatra closer to Moon landing (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (5, 'True', 'T', 35),
    (5, 'False', 'F', 65);

-- Q6: Napoleon short (False - he was average height)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (6, 'True', 'T', 68),
    (6, 'False', 'F', 32);

-- Q7: Vikings horned helmets (False)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (7, 'True', 'T', 55),
    (7, 'False', 'F', 45);

-- Q8: Roman Empire fell 476 AD (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (8, 'True', 'T', 72),
    (8, 'False', 'F', 28);

-- Q9: Einstein failed math (False)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (9, 'True', 'T', 61),
    (9, 'False', 'F', 39);

-- ==========================================
-- QUIZ 3: Geography Challenge (Mixed - 5 questions)
-- ==========================================
INSERT INTO quizzes (name, description) VALUES
    ('Geography Challenge', 'Test your knowledge of world geography');

-- Quiz 3 Questions (3 MC, 2 T/F)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (3, 'What is the longest river in the world?', 'multiple_choice', 1),
    (3, 'Which country has the largest population?', 'multiple_choice', 2),
    (3, 'What is the capital of Australia?', 'multiple_choice', 3),
    (3, 'Mount Everest is located entirely within Nepal.', 'true_false', 4),
    (3, 'Russia spans 11 time zones.', 'true_false', 5);

-- Quiz 3 Answers (question_id 10-14)
-- Q10: Longest river (Nile = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (10, 'Nile', 'A', 48),
    (10, 'Amazon', 'B', 35),
    (10, 'Yangtze', 'C', 12),
    (10, 'Mississippi', 'D', 5);

-- Q11: Largest population (China = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (11, 'China', 'A', 52),
    (11, 'India', 'B', 38),
    (11, 'USA', 'C', 7),
    (11, 'Indonesia', 'D', 3);

-- Q12: Capital of Australia (Canberra = C)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (12, 'Sydney', 'A', 45),
    (12, 'Melbourne', 'B', 18),
    (12, 'Canberra', 'C', 32),
    (12, 'Brisbane', 'D', 5);

-- Q13: Everest entirely in Nepal (False - Nepal/China border)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (13, 'True', 'T', 58),
    (13, 'False', 'F', 42);

-- Q14: Russia 11 time zones (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (14, 'True', 'T', 65),
    (14, 'False', 'F', 35);

-- ==========================================
-- QUIZ 4: Pop Culture Quiz (Mixed - 8 questions)
-- ==========================================
INSERT INTO quizzes (name, description) VALUES
    ('Pop Culture Quiz', 'How well do you know movies, music, and entertainment?');

-- Quiz 4 Questions (5 MC, 3 T/F)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (4, 'Which movie won the Academy Award for Best Picture in 2020?', 'multiple_choice', 1),
    (4, 'Who is the best-selling female music artist of all time?', 'multiple_choice', 2),
    (4, 'What year was the first iPhone released?', 'multiple_choice', 3),
    (4, 'Which streaming service produced "Stranger Things"?', 'multiple_choice', 4),
    (4, 'Who played Iron Man in the Marvel Cinematic Universe?', 'multiple_choice', 5),
    (4, 'The Beatles were originally from Liverpool.', 'true_false', 6),
    (4, 'Game of Thrones had 10 seasons.', 'true_false', 7),
    (4, 'Taylor Swift started her career as a country music singer.', 'true_false', 8);

-- Quiz 4 Answers (question_id 15-22)
-- Q15: Best Picture 2020 (Parasite = B)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (15, '1917', 'A', 25),
    (15, 'Parasite', 'B', 48),
    (15, 'Joker', 'C', 18),
    (15, 'Once Upon a Time in Hollywood', 'D', 9);

-- Q16: Best-selling female artist (Madonna = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (16, 'Madonna', 'A', 32),
    (16, 'Rihanna', 'B', 28),
    (16, 'Celine Dion', 'C', 22),
    (16, 'Whitney Houston', 'D', 18);

-- Q17: First iPhone year (2007 = B)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (17, '2005', 'A', 12),
    (17, '2007', 'B', 58),
    (17, '2008', 'C', 22),
    (17, '2010', 'D', 8);

-- Q18: Stranger Things platform (Netflix = A)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (18, 'Netflix', 'A', 82),
    (18, 'Amazon Prime', 'B', 8),
    (18, 'Hulu', 'C', 6),
    (18, 'Disney+', 'D', 4);

-- Q19: Iron Man actor (Robert Downey Jr. = C)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (19, 'Chris Evans', 'A', 8),
    (19, 'Chris Hemsworth', 'B', 5),
    (19, 'Robert Downey Jr.', 'C', 82),
    (19, 'Mark Ruffalo', 'D', 5);

-- Q20: Beatles from Liverpool (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (20, 'True', 'T', 78),
    (20, 'False', 'F', 22);

-- Q21: GOT had 10 seasons (False - 8 seasons)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (21, 'True', 'T', 25),
    (21, 'False', 'F', 75);

-- Q22: Taylor Swift started in country (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (22, 'True', 'T', 68),
    (22, 'False', 'F', 32);

-- ==========================================
-- QUIZ 5: Science & Nature Quiz (Mixed - 4 questions)
-- ==========================================
INSERT INTO quizzes (name, description) VALUES
    ('Science & Nature Quiz', 'Explore the wonders of science and the natural world');

-- Quiz 5 Questions (2 MC, 2 T/F)
INSERT INTO questions (quiz_id, question_text, question_type, order_index) VALUES
    (5, 'What is the chemical symbol for gold?', 'multiple_choice', 1),
    (5, 'How many planets are in our solar system?', 'multiple_choice', 2),
    (5, 'Humans share about 60% of their DNA with bananas.', 'true_false', 3),
    (5, 'Lightning can strike the same place twice.', 'true_false', 4);

-- Quiz 5 Answers (question_id 23-26)
-- Q23: Gold symbol (Au = C)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (23, 'Go', 'A', 15),
    (23, 'Gd', 'B', 8),
    (23, 'Au', 'C', 72),
    (23, 'Ag', 'D', 5);

-- Q24: Planets in solar system (8 = B)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (24, '7', 'A', 5),
    (24, '8', 'B', 75),
    (24, '9', 'C', 18),
    (24, '10', 'D', 2);

-- Q25: 60% DNA with bananas (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (25, 'True', 'T', 45),
    (25, 'False', 'F', 55);

-- Q26: Lightning same place twice (True)
INSERT INTO answers (question_id, answer_text, answer_label, guesses) VALUES
    (26, 'True', 'T', 58),
    (26, 'False', 'F', 42);

-- ==========================================
-- SET CORRECT ANSWERS FOR ALL QUESTIONS
-- ==========================================

-- Answer IDs after inserts:
-- Quiz 1: Q1 (1-4), Q2 (5-8), Q3 (9-12)
-- Quiz 2: Q4 (13-14), Q5 (15-16), Q6 (17-18), Q7 (19-20), Q8 (21-22), Q9 (23-24)
-- Quiz 3: Q10 (25-28), Q11 (29-32), Q12 (33-36), Q13 (37-38), Q14 (39-40)
-- Quiz 4: Q15 (41-44), Q16 (45-48), Q17 (49-52), Q18 (53-56), Q19 (57-60), Q20 (61-62), Q21 (63-64), Q22 (65-66)
-- Quiz 5: Q23 (67-70), Q24 (71-74), Q25 (75-76), Q26 (77-78)

-- Quiz 1 correct answers
UPDATE questions SET correct_answer_id = 1 WHERE id = 1;   -- Blue
UPDATE questions SET correct_answer_id = 5 WHERE id = 2;   -- Yes
UPDATE questions SET correct_answer_id = 11 WHERE id = 3;  -- Gemini

-- Quiz 2 correct answers (True/False)
UPDATE questions SET correct_answer_id = 14 WHERE id = 4;  -- False (Great Wall)
UPDATE questions SET correct_answer_id = 15 WHERE id = 5;  -- True (Cleopatra)
UPDATE questions SET correct_answer_id = 18 WHERE id = 6;  -- False (Napoleon)
UPDATE questions SET correct_answer_id = 20 WHERE id = 7;  -- False (Vikings)
UPDATE questions SET correct_answer_id = 21 WHERE id = 8;  -- True (Roman Empire)
UPDATE questions SET correct_answer_id = 24 WHERE id = 9;  -- False (Einstein)

-- Quiz 3 correct answers
UPDATE questions SET correct_answer_id = 25 WHERE id = 10; -- Nile
UPDATE questions SET correct_answer_id = 29 WHERE id = 11; -- China
UPDATE questions SET correct_answer_id = 35 WHERE id = 12; -- Canberra
UPDATE questions SET correct_answer_id = 38 WHERE id = 13; -- False (Everest)
UPDATE questions SET correct_answer_id = 39 WHERE id = 14; -- True (Russia 11 TZ)

-- Quiz 4 correct answers
UPDATE questions SET correct_answer_id = 42 WHERE id = 15; -- Parasite
UPDATE questions SET correct_answer_id = 45 WHERE id = 16; -- Madonna
UPDATE questions SET correct_answer_id = 50 WHERE id = 17; -- 2007
UPDATE questions SET correct_answer_id = 53 WHERE id = 18; -- Netflix
UPDATE questions SET correct_answer_id = 59 WHERE id = 19; -- Robert Downey Jr.
UPDATE questions SET correct_answer_id = 61 WHERE id = 20; -- True (Beatles)
UPDATE questions SET correct_answer_id = 64 WHERE id = 21; -- False (GOT 8 seasons)
UPDATE questions SET correct_answer_id = 65 WHERE id = 22; -- True (Taylor Swift country)

-- Quiz 5 correct answers
UPDATE questions SET correct_answer_id = 69 WHERE id = 23; -- Au
UPDATE questions SET correct_answer_id = 72 WHERE id = 24; -- 8 planets
UPDATE questions SET correct_answer_id = 75 WHERE id = 25; -- True (DNA bananas)
UPDATE questions SET correct_answer_id = 77 WHERE id = 26; -- True (Lightning)

-- ==========================================
-- SUBMISSIONS WITH CONTROLLED USER DISTRIBUTION
-- ==========================================

-- User Distribution Strategy:
-- Users 1-10:   Take exactly 2 quizzes (Quiz 1 and 2)
-- Users 11-20:  Take exactly 3 quizzes (Quiz 1, 2, and 3)
-- Users 21-30:  Take exactly 4 quizzes (Quiz 1, 2, 3, and 4)
-- Users 31-40:  Take all 5 quizzes

-- Remaining submissions filled with random users (41-1000) to reach 50-150 per quiz

-- ==========================================
-- QUIZ 1: AI Tools Survey (100 submissions, 3 questions)
-- ==========================================
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Users 1-10 (2 quiz takers)
    (1, 1, 3, 3), (1, 2, 2, 3), (1, 3, 3, 3), (1, 4, 1, 3), (1, 5, 2, 3),
    (1, 6, 3, 3), (1, 7, 2, 3), (1, 8, 1, 3), (1, 9, 3, 3), (1, 10, 2, 3),
    -- Users 11-20 (3 quiz takers)
    (1, 11, 3, 3), (1, 12, 2, 3), (1, 13, 3, 3), (1, 14, 1, 3), (1, 15, 2, 3),
    (1, 16, 3, 3), (1, 17, 2, 3), (1, 18, 2, 3), (1, 19, 3, 3), (1, 20, 1, 3),
    -- Users 21-30 (4 quiz takers)
    (1, 21, 3, 3), (1, 22, 2, 3), (1, 23, 3, 3), (1, 24, 2, 3), (1, 25, 1, 3),
    (1, 26, 3, 3), (1, 27, 2, 3), (1, 28, 3, 3), (1, 29, 2, 3), (1, 30, 3, 3),
    -- Users 31-40 (5 quiz takers)
    (1, 31, 3, 3), (1, 32, 2, 3), (1, 33, 3, 3), (1, 34, 1, 3), (1, 35, 3, 3),
    (1, 36, 2, 3), (1, 37, 3, 3), (1, 38, 2, 3), (1, 39, 3, 3), (1, 40, 2, 3),
    -- Random users 41-1000 to fill up to 100 submissions
    (1, 42, 3, 3), (1, 55, 2, 3), (1, 68, 3, 3), (1, 81, 1, 3), (1, 94, 2, 3),
    (1, 107, 3, 3), (1, 120, 2, 3), (1, 133, 3, 3), (1, 146, 2, 3), (1, 159, 1, 3),
    (1, 172, 3, 3), (1, 185, 2, 3), (1, 198, 3, 3), (1, 211, 2, 3), (1, 224, 3, 3),
    (1, 237, 1, 3), (1, 250, 2, 3), (1, 263, 3, 3), (1, 276, 2, 3), (1, 289, 3, 3),
    (1, 302, 2, 3), (1, 315, 1, 3), (1, 328, 3, 3), (1, 341, 2, 3), (1, 354, 3, 3),
    (1, 367, 2, 3), (1, 380, 3, 3), (1, 393, 1, 3), (1, 406, 2, 3), (1, 419, 3, 3),
    (1, 432, 2, 3), (1, 445, 3, 3), (1, 458, 2, 3), (1, 471, 1, 3), (1, 484, 3, 3),
    (1, 497, 2, 3), (1, 510, 3, 3), (1, 523, 2, 3), (1, 536, 3, 3), (1, 549, 1, 3),
    (1, 562, 2, 3), (1, 575, 3, 3), (1, 588, 2, 3), (1, 601, 3, 3), (1, 614, 2, 3),
    (1, 627, 1, 3), (1, 640, 3, 3), (1, 653, 2, 3), (1, 666, 3, 3), (1, 679, 2, 3),
    (1, 692, 3, 3), (1, 705, 1, 3), (1, 718, 2, 3), (1, 731, 3, 3), (1, 744, 2, 3),
    (1, 757, 3, 3), (1, 770, 2, 3), (1, 783, 1, 3), (1, 796, 3, 3), (1, 809, 2, 3);

-- ==========================================
-- QUIZ 2: Historical Facts (75 submissions, 6 questions)
-- ==========================================
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Users 1-10 (2 quiz takers)
    (2, 1, 5, 6), (2, 2, 4, 6), (2, 3, 6, 6), (2, 4, 3, 6), (2, 5, 4, 6),
    (2, 6, 5, 6), (2, 7, 3, 6), (2, 8, 4, 6), (2, 9, 6, 6), (2, 10, 4, 6),
    -- Users 11-20 (3 quiz takers)
    (2, 11, 5, 6), (2, 12, 4, 6), (2, 13, 6, 6), (2, 14, 3, 6), (2, 15, 5, 6),
    (2, 16, 4, 6), (2, 17, 5, 6), (2, 18, 3, 6), (2, 19, 6, 6), (2, 20, 4, 6),
    -- Users 21-30 (4 quiz takers)
    (2, 21, 6, 6), (2, 22, 4, 6), (2, 23, 5, 6), (2, 24, 3, 6), (2, 25, 5, 6),
    (2, 26, 4, 6), (2, 27, 6, 6), (2, 28, 4, 6), (2, 29, 5, 6), (2, 30, 3, 6),
    -- Users 31-40 (5 quiz takers)
    (2, 31, 6, 6), (2, 32, 5, 6), (2, 33, 4, 6), (2, 34, 6, 6), (2, 35, 3, 6),
    (2, 36, 5, 6), (2, 37, 4, 6), (2, 38, 6, 6), (2, 39, 5, 6), (2, 40, 4, 6),
    -- Random users to reach 75 total
    (2, 45, 5, 6), (2, 58, 4, 6), (2, 71, 6, 6), (2, 84, 3, 6), (2, 97, 5, 6),
    (2, 110, 4, 6), (2, 123, 6, 6), (2, 136, 3, 6), (2, 149, 5, 6), (2, 162, 4, 6),
    (2, 175, 5, 6), (2, 188, 3, 6), (2, 201, 6, 6), (2, 214, 4, 6), (2, 227, 5, 6),
    (2, 240, 3, 6), (2, 253, 4, 6), (2, 266, 6, 6), (2, 279, 5, 6), (2, 292, 4, 6),
    (2, 305, 3, 6), (2, 318, 5, 6), (2, 331, 6, 6), (2, 344, 4, 6), (2, 357, 5, 6),
    (2, 370, 3, 6), (2, 383, 4, 6), (2, 396, 6, 6), (2, 409, 5, 6), (2, 422, 4, 6),
    (2, 435, 3, 6), (2, 448, 5, 6), (2, 461, 4, 6), (2, 474, 6, 6), (2, 487, 5, 6);

-- ==========================================
-- QUIZ 3: Geography Challenge (120 submissions, 5 questions)
-- ==========================================
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Users 11-20 (3 quiz takers)
    (3, 11, 5, 5), (3, 12, 3, 5), (3, 13, 4, 5), (3, 14, 2, 5), (3, 15, 5, 5),
    (3, 16, 3, 5), (3, 17, 4, 5), (3, 18, 5, 5), (3, 19, 3, 5), (3, 20, 4, 5),
    -- Users 21-30 (4 quiz takers)
    (3, 21, 5, 5), (3, 22, 4, 5), (3, 23, 3, 5), (3, 24, 5, 5), (3, 25, 4, 5),
    (3, 26, 3, 5), (3, 27, 5, 5), (3, 28, 4, 5), (3, 29, 3, 5), (3, 30, 5, 5),
    -- Users 31-40 (5 quiz takers)
    (3, 31, 5, 5), (3, 32, 4, 5), (3, 33, 5, 5), (3, 34, 3, 5), (3, 35, 4, 5),
    (3, 36, 5, 5), (3, 37, 3, 5), (3, 38, 5, 5), (3, 39, 4, 5), (3, 40, 5, 5),
    -- Random users to fill up to 120
    (3, 50, 4, 5), (3, 63, 5, 5), (3, 76, 3, 5), (3, 89, 4, 5), (3, 102, 5, 5),
    (3, 115, 3, 5), (3, 128, 4, 5), (3, 141, 5, 5), (3, 154, 3, 5), (3, 167, 4, 5),
    (3, 180, 5, 5), (3, 193, 2, 5), (3, 206, 4, 5), (3, 219, 5, 5), (3, 232, 3, 5),
    (3, 245, 4, 5), (3, 258, 5, 5), (3, 271, 3, 5), (3, 284, 4, 5), (3, 297, 5, 5),
    (3, 310, 2, 5), (3, 323, 4, 5), (3, 336, 5, 5), (3, 349, 3, 5), (3, 362, 4, 5),
    (3, 375, 5, 5), (3, 388, 3, 5), (3, 401, 4, 5), (3, 414, 5, 5), (3, 427, 2, 5),
    (3, 440, 4, 5), (3, 453, 5, 5), (3, 466, 3, 5), (3, 479, 4, 5), (3, 492, 5, 5),
    (3, 505, 3, 5), (3, 518, 4, 5), (3, 531, 5, 5), (3, 544, 2, 5), (3, 557, 4, 5),
    (3, 570, 5, 5), (3, 583, 3, 5), (3, 596, 4, 5), (3, 609, 5, 5), (3, 622, 3, 5),
    (3, 635, 4, 5), (3, 648, 5, 5), (3, 661, 2, 5), (3, 674, 4, 5), (3, 687, 5, 5),
    (3, 700, 3, 5), (3, 713, 4, 5), (3, 726, 5, 5), (3, 739, 3, 5), (3, 752, 4, 5),
    (3, 765, 5, 5), (3, 778, 2, 5), (3, 791, 4, 5), (3, 804, 5, 5), (3, 817, 3, 5),
    (3, 830, 4, 5), (3, 843, 5, 5), (3, 856, 3, 5), (3, 869, 4, 5), (3, 882, 5, 5),
    (3, 895, 2, 5), (3, 908, 4, 5), (3, 921, 5, 5), (3, 934, 3, 5), (3, 947, 4, 5),
    (3, 960, 5, 5), (3, 973, 3, 5), (3, 986, 4, 5), (3, 999, 5, 5), (3, 51, 2, 5),
    (3, 64, 4, 5), (3, 77, 5, 5), (3, 90, 3, 5), (3, 103, 4, 5), (3, 116, 5, 5),
    (3, 129, 2, 5), (3, 142, 4, 5), (3, 155, 5, 5), (3, 168, 3, 5), (3, 181, 4, 5),
    (3, 194, 5, 5), (3, 207, 3, 5), (3, 220, 4, 5), (3, 233, 5, 5), (3, 246, 2, 5);

-- ==========================================
-- QUIZ 4: Pop Culture Quiz (150 submissions, 8 questions)
-- ==========================================
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Users 21-30 (4 quiz takers)
    (4, 21, 7, 8), (4, 22, 6, 8), (4, 23, 8, 8), (4, 24, 5, 8), (4, 25, 7, 8),
    (4, 26, 6, 8), (4, 27, 8, 8), (4, 28, 5, 8), (4, 29, 7, 8), (4, 30, 6, 8),
    -- Users 31-40 (5 quiz takers)
    (4, 31, 8, 8), (4, 32, 7, 8), (4, 33, 6, 8), (4, 34, 8, 8), (4, 35, 5, 8),
    (4, 36, 7, 8), (4, 37, 6, 8), (4, 38, 8, 8), (4, 39, 7, 8), (4, 40, 6, 8),
    -- Random users to fill up to 150
    (4, 52, 7, 8), (4, 65, 6, 8), (4, 78, 8, 8), (4, 91, 5, 8), (4, 104, 7, 8),
    (4, 117, 6, 8), (4, 130, 8, 8), (4, 143, 5, 8), (4, 156, 7, 8), (4, 169, 6, 8),
    (4, 182, 8, 8), (4, 195, 4, 8), (4, 208, 7, 8), (4, 221, 6, 8), (4, 234, 8, 8),
    (4, 247, 5, 8), (4, 260, 7, 8), (4, 273, 6, 8), (4, 286, 8, 8), (4, 299, 4, 8),
    (4, 312, 7, 8), (4, 325, 6, 8), (4, 338, 8, 8), (4, 351, 5, 8), (4, 364, 7, 8),
    (4, 377, 6, 8), (4, 390, 8, 8), (4, 403, 4, 8), (4, 416, 7, 8), (4, 429, 6, 8),
    (4, 442, 8, 8), (4, 455, 5, 8), (4, 468, 7, 8), (4, 481, 6, 8), (4, 494, 8, 8),
    (4, 507, 4, 8), (4, 520, 7, 8), (4, 533, 6, 8), (4, 546, 8, 8), (4, 559, 5, 8),
    (4, 572, 7, 8), (4, 585, 6, 8), (4, 598, 8, 8), (4, 611, 4, 8), (4, 624, 7, 8),
    (4, 637, 6, 8), (4, 650, 8, 8), (4, 663, 5, 8), (4, 676, 7, 8), (4, 689, 6, 8),
    (4, 702, 8, 8), (4, 715, 4, 8), (4, 728, 7, 8), (4, 741, 6, 8), (4, 754, 8, 8),
    (4, 767, 5, 8), (4, 780, 7, 8), (4, 793, 6, 8), (4, 806, 8, 8), (4, 819, 4, 8),
    (4, 832, 7, 8), (4, 845, 6, 8), (4, 858, 8, 8), (4, 871, 5, 8), (4, 884, 7, 8),
    (4, 897, 6, 8), (4, 910, 8, 8), (4, 923, 4, 8), (4, 936, 7, 8), (4, 949, 6, 8),
    (4, 962, 8, 8), (4, 975, 5, 8), (4, 988, 7, 8), (4, 53, 6, 8), (4, 66, 8, 8),
    (4, 79, 4, 8), (4, 92, 7, 8), (4, 105, 6, 8), (4, 118, 8, 8), (4, 131, 5, 8),
    (4, 144, 7, 8), (4, 157, 6, 8), (4, 170, 8, 8), (4, 183, 4, 8), (4, 196, 7, 8),
    (4, 209, 6, 8), (4, 222, 8, 8), (4, 235, 5, 8), (4, 248, 7, 8), (4, 261, 6, 8),
    (4, 274, 8, 8), (4, 287, 4, 8), (4, 300, 7, 8), (4, 313, 6, 8), (4, 326, 8, 8),
    (4, 339, 5, 8), (4, 352, 7, 8), (4, 365, 6, 8), (4, 378, 8, 8), (4, 391, 4, 8),
    (4, 404, 7, 8), (4, 417, 6, 8), (4, 430, 8, 8), (4, 443, 5, 8), (4, 456, 7, 8),
    (4, 469, 6, 8), (4, 482, 8, 8), (4, 495, 4, 8), (4, 508, 7, 8), (4, 521, 6, 8),
    (4, 534, 8, 8), (4, 547, 5, 8), (4, 560, 7, 8), (4, 573, 6, 8), (4, 586, 8, 8),
    (4, 599, 4, 8), (4, 612, 7, 8), (4, 625, 6, 8), (4, 638, 8, 8), (4, 651, 5, 8),
    (4, 664, 7, 8), (4, 677, 6, 8), (4, 690, 8, 8), (4, 703, 4, 8), (4, 716, 7, 8),
    (4, 729, 6, 8), (4, 742, 8, 8), (4, 755, 5, 8), (4, 768, 7, 8), (4, 781, 6, 8);

-- ==========================================
-- QUIZ 5: Science & Nature Quiz (55 submissions, 4 questions)
-- ==========================================
INSERT INTO submissions (quiz_id, user_id, correct_answers, total_questions) VALUES
    -- Users 31-40 (5 quiz takers)
    (5, 31, 4, 4), (5, 32, 3, 4), (5, 33, 4, 4), (5, 34, 2, 4), (5, 35, 4, 4),
    (5, 36, 3, 4), (5, 37, 4, 4), (5, 38, 3, 4), (5, 39, 4, 4), (5, 40, 2, 4),
    -- Random users to fill up to 55
    (5, 56, 4, 4), (5, 69, 3, 4), (5, 82, 4, 4), (5, 95, 2, 4), (5, 108, 4, 4),
    (5, 121, 3, 4), (5, 134, 4, 4), (5, 147, 2, 4), (5, 160, 4, 4), (5, 173, 3, 4),
    (5, 186, 4, 4), (5, 199, 1, 4), (5, 212, 3, 4), (5, 225, 4, 4), (5, 238, 2, 4),
    (5, 251, 4, 4), (5, 264, 3, 4), (5, 277, 4, 4), (5, 290, 1, 4), (5, 303, 3, 4),
    (5, 316, 4, 4), (5, 329, 2, 4), (5, 342, 4, 4), (5, 355, 3, 4), (5, 368, 4, 4),
    (5, 381, 1, 4), (5, 394, 3, 4), (5, 407, 4, 4), (5, 420, 2, 4), (5, 433, 4, 4),
    (5, 446, 3, 4), (5, 459, 4, 4), (5, 472, 1, 4), (5, 485, 3, 4), (5, 498, 4, 4),
    (5, 511, 2, 4), (5, 524, 4, 4), (5, 537, 3, 4), (5, 550, 4, 4), (5, 563, 1, 4),
    (5, 576, 3, 4), (5, 589, 4, 4), (5, 602, 2, 4), (5, 615, 4, 4), (5, 628, 3, 4);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify quiz data summary
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

-- Verify user distribution (how many quizzes each user took)
SELECT 
    CASE 
        WHEN quiz_count = 2 THEN '2 quizzes'
        WHEN quiz_count = 3 THEN '3 quizzes'
        WHEN quiz_count = 4 THEN '4 quizzes'
        WHEN quiz_count = 5 THEN '5 quizzes'
        ELSE 'Other'
    END AS quizzes_taken,
    COUNT(*) AS user_count
FROM (
    SELECT user_id, COUNT(DISTINCT quiz_id) AS quiz_count
    FROM submissions
    GROUP BY user_id
) user_quiz_counts
GROUP BY quiz_count
ORDER BY quiz_count;

-- Show specific users who took multiple quizzes
SELECT 
    user_id,
    COUNT(DISTINCT quiz_id) AS quizzes_taken,
    ARRAY_AGG(DISTINCT quiz_id ORDER BY quiz_id) AS quiz_ids
FROM submissions
WHERE user_id <= 40
GROUP BY user_id
ORDER BY user_id;

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
    username,
    full_name,
    total_submissions,
    average_score,
    highest_score
FROM user_activity_leaderboard
LIMIT 10;
