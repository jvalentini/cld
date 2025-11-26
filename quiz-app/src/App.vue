<template>
  <div class="container">
    <h1>📝 Quiz App</h1>
    <p class="subtitle">Test your knowledge</p>
    
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- File Upload -->
    <div v-if="!quizStarted" class="file-upload">
      <input type="file" id="fileInput" @change="loadQuizFile" accept=".json">
      <label for="fileInput">
        📁 Click to upload your quiz JSON file
      </label>
    </div>
    
    <!-- Quiz In Progress -->
    <div v-if="quizStarted && !quizCompleted">
      <div class="progress-bar">
        <div class="progress-fill" :style="{width: progressPercentage + '%'}"></div>
      </div>
      <div class="progress-text">
        Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
      </div>
      
      <div class="question-card">
        <div class="question-number">Question {{ currentQuestionIndex + 1 }}</div>
        <div class="question-text">{{ currentQuestion.question }}</div>
        
        <div class="answers">
          <div 
            v-for="(answer, index) in currentQuestion.answers" 
            :key="index"
            class="answer-option"
            :class="{selected: userAnswers[currentQuestionIndex] === index}"
            @click="selectAnswer(index)"
          >
            <span class="answer-label">{{ ['A', 'B', 'C', 'D'][index] }}</span>
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
      
      <div class="results-detail">
        <h3 style="margin-bottom: 20px;">Review Your Answers</h3>
        <div v-for="(question, qIndex) in questions" :key="qIndex" class="result-item">
          <div class="result-question">
            {{ qIndex + 1 }}. {{ question.question }}
          </div>
          <div 
            class="result-answer"
            :class="{correct: userAnswers[qIndex] === correctAnswers[qIndex], incorrect: userAnswers[qIndex] !== correctAnswers[qIndex]}"
          >
            Your answer: {{ ['A', 'B', 'C', 'D'][userAnswers[qIndex]] }}. {{ question.answers[userAnswers[qIndex]] }}
            <span v-if="userAnswers[qIndex] === correctAnswers[qIndex]"> ✓</span>
            <span v-else> ✗ (Correct: {{ ['A', 'B', 'C', 'D'][correctAnswers[qIndex]] }})</span>
          </div>
        </div>
      </div>
      
      <button class="btn-primary reset-btn" @click="resetQuiz">Take Quiz Again</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      questions: [],
      userAnswers: [],
      correctAnswers: [],
      currentQuestionIndex: 0,
      quizStarted: false,
      quizCompleted: false,
      error: null
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
      return this.userAnswers.filter((answer, index) => answer === this.correctAnswers[index]).length;
    },
    scorePercentage() {
      return Math.round((this.score / this.questions.length) * 100);
    }
  },
  methods: {
    loadQuizFile(event) {
      const file = event.target.files[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('Loading file:', file.name);
      const reader = new FileReader();
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        this.error = 'Failed to read the file.';
      };
      
      reader.onload = (e) => {
        try {
          console.log('File content:', e.target.result);
          const data = JSON.parse(e.target.result);
          console.log('Parsed data:', data);
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Invalid quiz format: expected an array of questions');
          }
          
          // Validate structure
          for (let i = 0; i < data.length; i++) {
            if (!data[i].question || !Array.isArray(data[i].answers)) {
              throw new Error(`Question ${i + 1} has invalid structure`);
            }
            if (data[i].answers.length !== 4) {
              throw new Error(`Question ${i + 1} must have exactly 4 answers`);
            }
          }
          
          this.questions = data;
          console.log('Questions loaded:', this.questions.length);
          this.initializeQuiz();
        } catch (err) {
          console.error('Parse error:', err);
          this.error = `Failed to load quiz file: ${err.message}`;
        }
      };
      
      reader.readAsText(file);
    },
    initializeQuiz() {
      const savedProgress = this.loadProgress();
      
      if (savedProgress && savedProgress.questions.length === this.questions.length) {
        this.userAnswers = savedProgress.userAnswers;
        this.currentQuestionIndex = savedProgress.currentQuestionIndex;
      } else {
        this.userAnswers = new Array(this.questions.length).fill(null);
        this.currentQuestionIndex = 0;
      }
      
      this.correctAnswers = this.questions.map(() => Math.floor(Math.random() * 4));
      
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
      this.userAnswers = new Array(this.questions.length).fill(null);
      this.currentQuestionIndex = 0;
      this.quizCompleted = false;
      this.correctAnswers = this.questions.map(() => Math.floor(Math.random() * 4));
      this.clearProgress();
    },
    saveProgress() {
      const progress = {
        questions: this.questions,
        userAnswers: this.userAnswers,
        currentQuestionIndex: this.currentQuestionIndex,
        timestamp: Date.now()
      };
      localStorage.setItem('quizProgress', JSON.stringify(progress));
    },
    loadProgress() {
      const saved = localStorage.getItem('quizProgress');
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
      localStorage.removeItem('quizProgress');
    }
  },
  mounted() {
    const savedProgress = this.loadProgress();
    if (savedProgress && savedProgress.questions.length > 0) {
      const resumeQuiz = confirm('You have an unfinished quiz. Would you like to resume?');
      if (resumeQuiz) {
        this.questions = savedProgress.questions;
        this.initializeQuiz();
      } else {
        this.clearProgress();
      }
    }
  }
}
</script>
