<script setup>
import { supabase } from './supabaseClient'
</script>
<template>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>📝 Quiz App</h1>
        <p class="subtitle">Test your knowledge</p>
      </div>
      <div class="nav-buttons">
        <button 
          v-if="currentView !== 'quiz' || quizStarted || quizCompleted"
          class="btn-nav" 
          @click="goToQuizPage"
        >
          🏠 Take Quiz
        </button>
        <button 
          v-if="currentView !== 'stats' && !quizStarted"
          class="btn-nav" 
          @click="goToStatsPage"
        >
          📊 View Statistics
        </button>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div v-if="currentView !== 'quiz' || quizStarted || quizCompleted" class="breadcrumb">
      <span @click="goToQuizPage" class="breadcrumb-link">Home</span>
      <span v-if="currentView === 'stats'" class="breadcrumb-separator">›</span>
      <span v-if="currentView === 'stats'" class="breadcrumb-current">Statistics</span>
      <span v-if="currentView === 'quiz-stats'" class="breadcrumb-separator">›</span>
      <span v-if="currentView === 'quiz-stats'" @click="goToStatsPage" class="breadcrumb-link">Statistics</span>
      <span v-if="currentView === 'quiz-stats'" class="breadcrumb-separator">›</span>
      <span v-if="currentView === 'quiz-stats'" class="breadcrumb-current">{{ selectedQuizStats?.name || 'Quiz Details' }}</span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>

    <!-- Statistics Overview Page -->
    <div v-if="currentView === 'stats' && !quizStarted">
      <h2>📊 Quiz Statistics</h2>
      
      <div v-if="loadingStats" class="loading">Loading statistics...</div>
      
      <div v-else>
        <!-- Overall Statistics -->
        <div class="stats-overview">
          <h3>Overall Statistics</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ allQuizStats.length }}</div>
              <div class="stat-label">Total Quizzes</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalSubmissions }}</div>
              <div class="stat-label">Total Submissions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ overallAverageScore }}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>
        </div>

        <!-- Individual Quiz List -->
        <div class="quiz-stats-list">
          <h3>Individual Quizzes</h3>
          <div v-if="allQuizStats.length === 0" class="no-data">
            No quiz statistics available yet. Take some quizzes to see statistics!
          </div>
          <div v-else class="quiz-cards">
            <div 
              v-for="quiz in allQuizStats" 
              :key="quiz.quiz_id"
              class="quiz-stat-card"
              @click="viewQuizStats(quiz.quiz_id)"
            >
              <div class="quiz-stat-header">
                <h4>{{ quiz.quiz_name }}</h4>
                <span class="view-link">View Details →</span>
              </div>
              <div class="quiz-stat-body">
                <div class="quiz-stat-item">
                  <span class="label">Questions:</span>
                  <span class="value">{{ quiz.total_questions || 0 }}</span>
                </div>
                <div class="quiz-stat-item">
                  <span class="label">Submissions:</span>
                  <span class="value">{{ quiz.total_submissions || 0 }}</span>
                </div>
                <div class="quiz-stat-item">
                  <span class="label">Average Score:</span>
                  <span class="value">{{ quiz.average_score || 0 }}%</span>
                </div>
                <div class="quiz-stat-item">
                  <span class="label">Highest Score:</span>
                  <span class="value">{{ quiz.highest_score || 0 }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Individual Quiz Statistics Page -->
    <div v-if="currentView === 'quiz-stats' && !quizStarted">
      <div v-if="loadingStats" class="loading">Loading quiz statistics...</div>
      
      <div v-else-if="selectedQuizStats">
        <h2>{{ selectedQuizStats.name }}</h2>
        
        <!-- Quiz Overview Stats -->
        <div class="stats-overview">
          <h3>Quiz Overview</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ selectedQuizStats.total_questions || 0 }}</div>
              <div class="stat-label">Total Questions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedQuizStats.total_submissions || 0 }}</div>
              <div class="stat-label">Submissions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedQuizStats.average_score || 0 }}%</div>
              <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedQuizStats.highest_score || 0 }}%</div>
              <div class="stat-label">Highest Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ selectedQuizStats.lowest_score || 0 }}%</div>
              <div class="stat-label">Lowest Score</div>
            </div>
          </div>
        </div>

        <!-- Question Statistics -->
        <div class="question-stats">
          <h3>Question Statistics</h3>
          <div v-if="questionStats.length === 0" class="no-data">
            No question statistics available yet.
          </div>
          <div v-else class="question-stats-list">
            <div 
              v-for="(qStat, index) in questionStats" 
              :key="qStat.question_id"
              class="question-stat-card"
            >
              <div class="question-stat-header">
                <span class="question-number">Question {{ index + 1 }}</span>
                <span class="question-type-badge" :class="qStat.question_type === 'true_false' ? 'badge-true-false' : 'badge-multiple-choice'">
                  {{ qStat.question_type === 'true_false' ? 'True/False' : 'Multiple Choice' }}
                </span>
              </div>
              <div class="question-stat-text">{{ qStat.question_text }}</div>
              <div class="question-stat-metrics">
                <div class="metric">
                  <span class="metric-label">Total Guesses:</span>
                  <span class="metric-value">{{ qStat.total_guesses || 0 }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Correct Guesses:</span>
                  <span class="metric-value">{{ qStat.correct_guesses || 0 }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Correct Rate:</span>
                  <span class="metric-value" :class="getCorrectRateClass(qStat.correct_percentage)">
                    {{ qStat.correct_percentage || 0 }}%
                  </span>
                </div>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar-fill" 
                  :class="getCorrectRateClass(qStat.correct_percentage)"
                  :style="{ width: (qStat.correct_percentage || 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Selection (existing) -->
    <div v-if="currentView === 'quiz' && !quizStarted" class="quiz-selector">
      <h3>Select a Quiz from Database</h3>
      <div v-if="loadingQuizzes" class="loading">Loading quizzes...</div>
      <div v-else class="selector-group">
        <select v-model="selectedQuizId">
          <option value="">-- Choose a quiz --</option>
          <option
            v-for="quiz in availableQuizzes"
            :key="quiz.id"
            :value="quiz.id"
          >
            {{ quiz.name }}
          </option>
        </select>
        <button
          class="btn-load"
          @click="loadQuizFromDatabase"
          :disabled="!selectedQuizId"
        >
          Load Quiz
        </button>
      </div>
    </div>

    <!-- File Upload -->
    <div v-if="!quizStarted">
      <div class="divider">OR</div>
      <div class="file-upload">
        <input
          type="file"
          id="fileInput"
          @change="loadQuizFile"
          accept=".json"
        />
        <label for="fileInput"> 📁 Upload a new quiz JSON file </label>
        <div v-if="uploadedQuizData" class="quiz-name-input">
          <label for="quizNameInput" class="input-label">Quiz Name:</label>
          <input
            id="quizNameInput"
            v-model="uploadedQuizName"
            type="text"
            placeholder="Enter a name for this quiz"
            required
          />
          <button
            class="btn-save"
            @click="saveUploadedQuizToDatabase"
            :disabled="!uploadedQuizName || !uploadedQuizData"
          >
            💾 Save Quiz to Database
          </button>
        </div>
      </div>
    </div>

    <!-- Quiz In Progress -->
    <div v-if="quizStarted && !quizCompleted">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="progress-text">
        Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
      </div>

      <div class="question-card">
        <span class="question-type-badge" :class="getQuestionTypeBadgeClass()">
          {{ getQuestionTypeLabel() }}
        </span>
        <div class="question-number">
          Question {{ currentQuestionIndex + 1 }}
        </div>
        <div class="question-text">{{ currentQuestion.question }}</div>

        <div class="answers">
          <div
            v-for="(answer, index) in currentQuestion.answers"
            :key="index"
            class="answer-option"
            :class="{ selected: userAnswers[currentQuestionIndex] === index }"
            @click="selectAnswer(index)"
          >
            <span class="answer-label">{{ getAnswerLabel(index) }}</span>
            <span class="answer-text">{{ answer }}</span>
          </div>
        </div>
      </div>

      <div class="navigation">
        <button
          class="btn-secondary"
          @click="previousQuestion"
          :disabled="currentQuestionIndex === 0"
        >
          ← Previous
        </button>
        <button
          v-if="currentQuestionIndex < questions.length - 1"
          class="btn-primary"
          @click="nextQuestion"
          :disabled="userAnswers[currentQuestionIndex] === null"
        >
          Next →
        </button>
        <button
          v-else
          class="btn-primary"
          @click="finishQuiz"
          :disabled="userAnswers[currentQuestionIndex] === null"
        >
          Finish Quiz
        </button>
      </div>
    </div>

    <!-- Results -->
    <div v-if="quizCompleted" class="results">
      <h2>🎉 Quiz Complete!</h2>
      <div class="score">{{ score }} / {{ questions.length }}</div>
      <p class="subtitle">{{ scorePercentage }}% Correct</p>

      <div
        class="score-breakdown"
        v-if="multipleChoiceScore.total > 0 || trueFalseScore.total > 0"
      >
        <div class="score-item" v-if="multipleChoiceScore.total > 0">
          <div class="score-value">{{ multipleChoiceScore.correct }}</div>
          <div class="score-label">Multiple Choice Correct</div>
        </div>
        <div class="score-item" v-if="trueFalseScore.total > 0">
          <div class="score-value">{{ trueFalseScore.correct }}</div>
          <div class="score-label">True/False Correct</div>
        </div>
      </div>

      <div class="results-detail">
        <h3 style="margin-bottom: 20px">Review Your Answers</h3>
        <div
          v-for="(question, qIndex) in questions"
          :key="qIndex"
          class="result-item"
        >
          <div class="result-header">
            <span
              class="question-type-badge"
              :class="getQuestionTypeBadgeClassForIndex(qIndex)"
            >
              {{ getQuestionTypeLabelForIndex(qIndex) }}
            </span>
          </div>
          <div class="result-question">
            {{ qIndex + 1 }}. {{ question.question }}
          </div>
          <div
            class="result-answer"
            :class="{
              correct: userAnswers[qIndex] === correctAnswers[qIndex],
              incorrect: userAnswers[qIndex] !== correctAnswers[qIndex],
            }"
          >
            Your answer: {{ getAnswerLabelForResult(question, qIndex) }}.
            {{ question.answers[userAnswers[qIndex]] }}
            <span v-if="userAnswers[qIndex] === correctAnswers[qIndex]">
              ✓</span
            >
            <span v-else>
              ✗ (Correct:
              {{ getAnswerLabelForResult(question, qIndex, true) }})</span
            >
          </div>
        </div>
      </div>

      <button class="btn-primary reset-btn" @click="resetQuiz">
        Take Another Quiz
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      // Quiz selection
      availableQuizzes: [],
      selectedQuizId: "",
      loadingQuizzes: false,

      // Quiz state
      currentQuizId: null,
      questions: [],
      questionIds: [], // Store DB question IDs
      answerIds: [], // Store DB answer IDs for each question
      userAnswers: [],
      correctAnswers: [],
      currentQuestionIndex: 0,
      quizStarted: false,
      quizCompleted: false,

      // File upload
      uploadedQuizName: "",
      uploadedQuizData: null,

      // Statistics view state
      currentView: 'quiz', // 'quiz', 'stats', 'quiz-stats'
      selectedStatsQuizId: null,
      allQuizStats: [],
      selectedQuizStats: null,
      questionStats: [],
      loadingStats: false,

      // UI state
      error: null,
      success: null,
    };
  },
  computed: {
    currentQuestion() {
      return this.questions[this.currentQuestionIndex] || {};
    },
    progressPercentage() {
      return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
    },
    score() {
      return this.userAnswers.filter(
        (answer, index) => answer === this.correctAnswers[index]
      ).length;
    },
    scorePercentage() {
      return Math.round((this.score / this.questions.length) * 100);
    },
    multipleChoiceScore() {
      const mcQuestions = this.questions.filter(
        (q, idx) =>
          q.type === "multiple_choice" && this.userAnswers[idx] !== null
      );
      const correct = mcQuestions.filter((q, idx) => {
        const originalIdx = this.questions.findIndex((oq) => oq === q);
        return (
          this.userAnswers[originalIdx] === this.correctAnswers[originalIdx]
        );
      }).length;
      return { total: mcQuestions.length, correct: correct };
    },
    trueFalseScore() {
      const tfQuestions = this.questions.filter(
        (q, idx) => q.type === "true_false" && this.userAnswers[idx] !== null
      );
      const correct = tfQuestions.filter((q, idx) => {
        const originalIdx = this.questions.findIndex((oq) => oq === q);
        return (
          this.userAnswers[originalIdx] === this.correctAnswers[originalIdx]
        );
      }).length;
      return { total: tfQuestions.length, correct: correct };
    },
    totalSubmissions() {
      return this.allQuizStats.reduce((sum, quiz) => sum + (quiz.total_submissions || 0), 0);
    },
    overallAverageScore() {
      if (this.allQuizStats.length === 0) return 0;
      const total = this.allQuizStats.reduce((sum, quiz) => sum + (quiz.average_score || 0), 0);
      return Math.round(total / this.allQuizStats.length);
    },
  },
  methods: {
    async loadAvailableQuizzes() {
      this.loadingQuizzes = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("id, name, description")
          .order("name");

        if (error) throw error;

        this.availableQuizzes = data;
        console.log("Loaded quizzes:", data.length);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        this.error =
          "Failed to load quizzes from database. Please check your Supabase connection.";
      } finally {
        this.loadingQuizzes = false;
      }
    },

    async loadQuizFromDatabase() {
      if (!this.selectedQuizId) return;

      this.error = null;

      try {
        // Load questions
        const { data: questions, error: qError } = await supabase
          .from("questions")
          .select(
            "id, question_text, question_type, order_index, correct_answer_id"
          )
          .eq("quiz_id", this.selectedQuizId)
          .order("order_index");

        if (qError) throw qError;
        if (!questions || questions.length === 0) {
          throw new Error("No questions found for this quiz");
        }

        // Load answers for all questions
        const { data: answers, error: aError } = await supabase
          .from("answers")
          .select("id, question_id, answer_text, answer_label")
          .in(
            "question_id",
            questions.map((q) => q.id)
          )
          .order("answer_label");

        if (aError) throw aError;

        // Group answers by question
        const answersByQuestion = {};
        const answerIdsByQuestion = {};
        answers.forEach((ans) => {
          if (!answersByQuestion[ans.question_id]) {
            answersByQuestion[ans.question_id] = [];
            answerIdsByQuestion[ans.question_id] = [];
          }
          answersByQuestion[ans.question_id].push(ans.answer_text);
          answerIdsByQuestion[ans.question_id].push(ans.id);
        });

        // Build quiz data
        this.questions = questions.map((q) => ({
          question: q.question_text,
          answers: answersByQuestion[q.id] || [],
          type: q.question_type,
        }));

        this.questionIds = questions.map((q) => q.id);
        this.answerIds = questions.map((q) => answerIdsByQuestion[q.id] || []);
        this.correctAnswers = questions.map((q, idx) => {
          const correctAnswerId = q.correct_answer_id;
          return this.answerIds[idx].indexOf(correctAnswerId);
        });

        this.currentQuizId = this.selectedQuizId;
        this.initializeQuiz();
      } catch (err) {
        console.error("Error loading quiz:", err);
        this.error = `Failed to load quiz: ${err.message}`;
      }
    },

    async loadQuizFile(event) {
      const file = event.target.files[0];
      if (!file) {
        console.log("No file selected");
        return;
      }

      console.log("Loading file:", file.name);
      const reader = new FileReader();

      reader.onerror = (e) => {
        console.error("FileReader error:", e);
        this.error = "Failed to read the file.";
      };

      reader.onload = async (e) => {
        try {
          console.log("File content:", e.target.result);
          const data = JSON.parse(e.target.result);
          console.log("Parsed data:", data);

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error(
              "Invalid quiz format: expected an array of questions"
            );
          }

          // Validate structure
          for (let i = 0; i < data.length; i++) {
            if (!data[i].question || !Array.isArray(data[i].answers)) {
              throw new Error(`Question ${i + 1} has invalid structure`);
            }

            // Detect question type if not specified
            if (!data[i].type) {
              if (
                data[i].answers.length === 2 &&
                data[i].answers.includes("True") &&
                data[i].answers.includes("False")
              ) {
                data[i].type = "true_false";
              } else {
                data[i].type = "multiple_choice";
              }
            }

            // Validate answer count based on type
            if (
              data[i].type === "multiple_choice" &&
              data[i].answers.length !== 4
            ) {
              throw new Error(
                `Multiple choice question ${i + 1} must have exactly 4 answers`
              );
            }
            if (data[i].type === "true_false" && data[i].answers.length !== 2) {
              throw new Error(
                `True/False question ${i + 1} must have exactly 2 answers`
              );
            }
          }

          this.uploadedQuizData = data;
          this.uploadedQuizName = file.name.replace(".json", "");
          this.error = null;
          this.success =
            "Quiz loaded! Enter a name and click 'Save Quiz to Database' to save it.";
        } catch (err) {
          console.error("Parse error:", err);
          this.error = `Failed to load quiz file: ${err.message}`;
        }
      };

      reader.readAsText(file);
    },

    async saveUploadedQuizToDatabase() {
      if (!this.uploadedQuizData || !this.uploadedQuizName) {
        this.error = "Please load a quiz file and enter a name first.";
        return;
      }

      this.error = null;
      this.success = "Saving quiz to database...";

      try {
        // Create quiz record
        const { data: quiz, error: quizError } = await supabase
          .from("quizzes")
          .insert({
            name: this.uploadedQuizName,
            description: "Uploaded from JSON file",
          })
          .select()
          .single();

        if (quizError) throw quizError;

        const quizId = quiz.id;
        this.currentQuizId = quizId;

        // Create questions and answers with proper foreign keys
        const questionPromises = this.uploadedQuizData.map(async (q, index) => {
          // Insert question
          const { data: question, error: qError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quizId, // Foreign key to quiz
              question_text: q.question,
              question_type: q.type,
              order_index: index + 1,
            })
            .select()
            .single();

          if (qError) throw qError;

          // Insert answers for this question
          const labels =
            q.type === "true_false" ? ["T", "F"] : ["A", "B", "C", "D"];
          const answerPromises = q.answers.map(async (ans, ansIndex) => {
            const { data, error } = await supabase
              .from("answers")
              .insert({
                question_id: question.id, // Foreign key to question
                answer_text: ans,
                answer_label: labels[ansIndex],
                guesses: 0,
              })
              .select()
              .single();
            
            if (error) {
              console.error('Answer insert error:', error);
              throw new Error(`Failed to insert answer: ${error.message}`);
            }
            
            return { data, error };
          });

          const answerResults = await Promise.all(answerPromises);
          const answerData = answerResults.map((r) => r.data);

          // If the JSON has a correct_answer field (index), use it
          // Otherwise, we'll need to set it manually later
          if (q.correct_answer !== undefined && answerData[q.correct_answer]) {
            const correctAnswerId = answerData[q.correct_answer].id;
            await supabase
              .from("questions")
              .update({ correct_answer_id: correctAnswerId })
              .eq("id", question.id);
          }

          return {
            question: question,
            answers: answerData,
          };
        });

        const results = await Promise.all(questionPromises);

        // Build local quiz data for starting the quiz
        this.questions = this.uploadedQuizData;
        this.questionIds = results.map((r) => r.question.id);
        this.answerIds = results.map((r) => r.answers.map((a) => a.id));
        
        // Set correct answers from JSON if available
        this.correctAnswers = this.questions.map((q, idx) => {
          if (q.correct_answer !== undefined) {
            return q.correct_answer;
          }
          // Default to random for demo if not specified
          return Math.floor(
            Math.random() * (q.type === "true_false" ? 2 : 4)
          );
        });

        this.success = `Quiz "${this.uploadedQuizName}" saved to database successfully with ${results.length} questions!`;
        
        // Start the quiz
        this.initializeQuiz();

        // Reload available quizzes
        await this.loadAvailableQuizzes();
      } catch (err) {
        console.error("Error saving quiz:", err);
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        
        // Check if it's an RLS error
        if (err.message && err.message.includes('row-level security policy')) {
          this.error = `Database security error: Row Level Security (RLS) is blocking the insert. 
          
          To fix this, you need to either:
          1. Disable RLS on the quizzes, questions, and answers tables, OR
          2. Add RLS policies that allow inserts (see the RLS_SETUP.md file for instructions)`;
        } else if (err.message && err.message.includes('Failed to insert answer')) {
          this.error = `Failed to insert answers: ${err.message}
          
          This might be a database schema issue. Check that your 'answers' table has these columns:
          - id (primary key)
          - question_id (foreign key to questions.id)
          - answer_text (text)
          - answer_label (text)
          - guesses (integer, default 0)
          
          See DATABASE_SCHEMA.md for the complete schema.`;
        } else {
          this.error = `Failed to save quiz to database: ${err.message}`;
        }
      }
    },
    initializeQuiz() {
      const savedProgress = this.loadProgress();

      if (
        savedProgress &&
        savedProgress.questions.length === this.questions.length
      ) {
        this.userAnswers = savedProgress.userAnswers;
        this.currentQuestionIndex = savedProgress.currentQuestionIndex;
      } else {
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.currentQuestionIndex = 0;
      }

      // For demo purposes, randomly assign correct answers
      this.correctAnswers = this.questions.map((q) => {
        if (q.type === "true_false") {
          return Math.floor(Math.random() * 2); // 0 or 1
        } else {
          return Math.floor(Math.random() * 4); // 0-3
        }
      });

      this.quizStarted = true;
      this.error = null;
    },
    selectAnswer(answerIndex) {
      this.userAnswers[this.currentQuestionIndex] = answerIndex;
      this.saveProgress();
    },
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.saveProgress();
      }
    },
    previousQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.saveProgress();
      }
    },
    finishQuiz() {
      this.quizCompleted = true;
      this.clearProgress();
    },
    resetQuiz() {
      // Reset all quiz state
      this.questions = [];
      this.questionIds = [];
      this.answerIds = [];
      this.userAnswers = [];
      this.correctAnswers = [];
      this.currentQuestionIndex = 0;
      this.quizCompleted = false;
      this.quizStarted = false;
      
      // Reset quiz selection
      this.currentQuizId = null;
      this.selectedQuizId = "";
      
      // Reset file upload state
      this.uploadedQuizName = "";
      this.uploadedQuizData = null;
      
      // Clear messages
      this.error = null;
      this.success = null;
      
      // Clear progress
      this.clearProgress();
      
      // Reload available quizzes to show any newly created ones
      this.loadAvailableQuizzes();
    },
    
    // Statistics methods
    async goToStatsPage() {
      this.currentView = 'stats';
      this.error = null;
      this.success = null;
      await this.loadAllQuizStats();
    },
    
    async goToQuizPage() {
      this.currentView = 'quiz';
      this.selectedStatsQuizId = null;
      this.selectedQuizStats = null;
      this.questionStats = [];
      this.error = null;
      this.success = null;
    },
    
    async loadAllQuizStats() {
      this.loadingStats = true;
      this.error = null;
      
      try {
        const { data, error } = await supabase
          .from('quiz_statistics')
          .select('*')
          .order('quiz_name');
        
        if (error) throw error;
        
        this.allQuizStats = data || [];
      } catch (err) {
        console.error('Error loading quiz statistics:', err);
        this.error = `Failed to load statistics: ${err.message}`;
      } finally {
        this.loadingStats = false;
      }
    },
    
    async viewQuizStats(quizId) {
      this.currentView = 'quiz-stats';
      this.selectedStatsQuizId = quizId;
      this.loadingStats = true;
      this.error = null;
      
      try {
        // Load quiz overview stats
        const { data: quizData, error: quizError } = await supabase
          .from('quiz_statistics')
          .select('*')
          .eq('quiz_id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        this.selectedQuizStats = quizData;
        
        // Load question statistics
        const { data: questionData, error: questionError } = await supabase
          .from('question_statistics')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_id');
        
        if (questionError) throw questionError;
        
        this.questionStats = questionData || [];
      } catch (err) {
        console.error('Error loading quiz statistics:', err);
        this.error = `Failed to load quiz statistics: ${err.message}`;
        this.currentView = 'stats';
      } finally {
        this.loadingStats = false;
      }
    },
    
    getCorrectRateClass(percentage) {
      if (percentage >= 80) return 'high';
      if (percentage >= 50) return 'medium';
      return 'low';
    },
    
    getAnswerLabel(index) {
      if (this.currentQuestion.type === "true_false") {
        return index === 0 ? "T" : "F";
      } else {
        return ["A", "B", "C", "D"][index];
      }
    },
    getAnswerLabelForResult(question, qIndex, useCorrect = false) {
      const answerIndex = useCorrect
        ? this.correctAnswers[qIndex]
        : this.userAnswers[qIndex];
      if (question.type === "true_false") {
        return answerIndex === 0 ? "T" : "F";
      } else {
        return ["A", "B", "C", "D"][answerIndex];
      }
    },
    getQuestionTypeLabel() {
      return this.currentQuestion.type === "true_false"
        ? "True/False"
        : "Multiple Choice";
    },
    getQuestionTypeBadgeClass() {
      return this.currentQuestion.type === "true_false"
        ? "badge-true-false"
        : "badge-multiple-choice";
    },
    getQuestionTypeLabelForIndex(index) {
      return this.questions[index].type === "true_false"
        ? "True/False"
        : "Multiple Choice";
    },
    getQuestionTypeBadgeClassForIndex(index) {
      return this.questions[index].type === "true_false"
        ? "badge-true-false"
        : "badge-multiple-choice";
    },
    saveProgress() {
      const progress = {
        questions: this.questions,
        userAnswers: this.userAnswers,
        currentQuestionIndex: this.currentQuestionIndex,
        timestamp: Date.now(),
      };
      localStorage.setItem("quizProgress", JSON.stringify(progress));
    },
    loadProgress() {
      const saved = localStorage.getItem("quizProgress");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
      return null;
    },
    clearProgress() {
      localStorage.removeItem("quizProgress");
    },
  },
  mounted() {
    // Load available quizzes from database
    this.loadAvailableQuizzes();
    
    const savedProgress = this.loadProgress();
    if (savedProgress && savedProgress.questions.length > 0) {
      const resumeQuiz = confirm(
        "You have an unfinished quiz. Would you like to resume?"
      );
      if (resumeQuiz) {
        this.questions = savedProgress.questions;
        this.initializeQuiz();
      } else {
        this.clearProgress();
      }
    }
  },
};
</script>

<style scoped>
.quiz-name-input {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  margin-bottom: -8px;
}

.quiz-name-input input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.quiz-name-input input[type="text"]:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-save {
  padding: 12px 24px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(40, 167, 69, 0.2);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(40, 167, 69, 0.3);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Header and Navigation */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.header-content h1 {
  margin: 0;
}

.header-content .subtitle {
  margin: 5px 0 0 0;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.btn-nav {
  padding: 10px 20px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 6px;
  color: #007bff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nav:hover {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #6c757d;
}

.breadcrumb-link {
  color: #007bff;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #adb5bd;
  user-select: none;
}

.breadcrumb-current {
  color: #495057;
  font-weight: 600;
}

/* Statistics Overview */
.stats-overview {
  margin-bottom: 40px;
}

.stats-overview h3 {
  margin-bottom: 20px;
  color: #495057;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Quiz Stats List */
.quiz-stats-list {
  margin-top: 40px;
}

.quiz-stats-list h3 {
  margin-bottom: 20px;
  color: #495057;
}

.quiz-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.quiz-stat-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quiz-stat-card:hover {
  border-color: #007bff;
  box-shadow: 0 8px 16px rgba(0, 123, 255, 0.1);
  transform: translateY(-4px);
}

.quiz-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.quiz-stat-header h4 {
  margin: 0;
  color: #495057;
  font-size: 18px;
}

.view-link {
  color: #007bff;
  font-size: 14px;
  font-weight: 600;
}

.quiz-stat-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.quiz-stat-item .label {
  color: #6c757d;
  font-size: 14px;
}

.quiz-stat-item .value {
  color: #495057;
  font-weight: 600;
  font-size: 16px;
}

/* Question Statistics */
.question-stats {
  margin-top: 40px;
}

.question-stats h3 {
  margin-bottom: 20px;
  color: #495057;
}

.question-stats-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-stat-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.question-stat-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1);
}

.question-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 700;
  color: #495057;
  font-size: 14px;
}

.question-stat-text {
  font-size: 16px;
  color: #495057;
  margin-bottom: 15px;
  line-height: 1.5;
}

.question-stat-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #495057;
}

.metric-value.high {
  color: #28a745;
}

.metric-value.medium {
  color: #ffc107;
}

.metric-value.low {
  color: #dc3545;
}

/* Progress Bar for Question Stats */
.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.progress-bar-fill.high {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.progress-bar-fill.medium {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.progress-bar-fill.low {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

/* No Data State */
.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6c757d;
}
</style>