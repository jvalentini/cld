<script setup>
import { supabase } from "./supabaseClient";
</script>
<template>
  <div class="container">
    <h1>📝 Quiz App</h1>
    <p class="subtitle">Test your knowledge</p>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>

    <!-- Quiz Selection -->
    <div v-if="!quizStarted" class="quiz-selector">
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
              console.error("Answer insert error:", error);
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
          return Math.floor(Math.random() * (q.type === "true_false" ? 2 : 4));
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
          name: err.name,
        });

        // Check if it's an RLS error
        if (err.message && err.message.includes("row-level security policy")) {
          this.error = `Database security error: Row Level Security (RLS) is blocking the insert. 
          
          To fix this, you need to either:
          1. Disable RLS on the quizzes, questions, and answers tables, OR
          2. Add RLS policies that allow inserts (see the RLS_SETUP.md file for instructions)`;
        } else if (
          err.message &&
          err.message.includes("Failed to insert answer")
        ) {
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

      // Reload available quizzes
      this.loadAvailableQuizzes();
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
</style>
