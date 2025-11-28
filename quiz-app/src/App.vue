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
            <span class="question-type-badge" :class="getQuestionTypeBadgeClass()">
                {{ getQuestionTypeLabel() }}
            </span>
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
        
        <div class="score-breakdown">
            <div class="score-item">
                <div class="score-value">{{ multipleChoiceScore.correct }}</div>
                <div class="score-label">Multiple Choice Correct</div>
            </div>
            <div class="score-item">
                <div class="score-value">{{ trueFalseScore.correct }}</div>
                <div class="score-label">True/False Correct</div>
            </div>
        </div>
        
        <div class="results-detail">
            <h3 style="margin-bottom: 20px;">Review Your Answers</h3>
            <div v-for="(question, qIndex) in questions" :key="qIndex" class="result-item">
                <div class="result-header">
                    <span class="question-type-badge" :class="getQuestionTypeBadgeClassForIndex(qIndex)">
                        {{ getQuestionTypeLabelForIndex(qIndex) }}
                    </span>
                </div>
                <div class="result-question">
                    {{ qIndex + 1 }}. {{ question.question }}
                </div>
                <div 
                    class="result-answer"
                    :class="{correct: userAnswers[qIndex] === correctAnswers[qIndex], incorrect: userAnswers[qIndex] !== correctAnswers[qIndex]}"
                >
                    Your answer: {{ getAnswerLabelForResult(question, qIndex) }}. {{ question.answers[userAnswers[qIndex]] }}
                    <span v-if="userAnswers[qIndex] === correctAnswers[qIndex]"> ✓</span>
                    <span v-else> ✗ (Correct: {{ getAnswerLabelForResult(question, qIndex, true) }})</span>
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
      },
      multipleChoiceScore() {
          const mcQuestions = this.questions.filter((q, idx) => 
              q.type === 'multiple_choice' && this.userAnswers[idx] !== null
          );
          const correct = mcQuestions.filter((q, idx) => {
              const originalIdx = this.questions.findIndex(oq => oq === q);
              return this.userAnswers[originalIdx] === this.correctAnswers[originalIdx];
          }).length;
          return {
              total: mcQuestions.length,
              correct: correct
          };
      },
      trueFalseScore() {
          const tfQuestions = this.questions.filter((q, idx) => 
              q.type === 'true_false' && this.userAnswers[idx] !== null
          );
          const correct = tfQuestions.filter((q, idx) => {
              const originalIdx = this.questions.findIndex(oq => oq === q);
              return this.userAnswers[originalIdx] === this.correctAnswers[originalIdx];
          }).length;
          return {
              total: tfQuestions.length,
              correct: correct
          };
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
                      
                      // Detect question type if not specified
                      if (!data[i].type) {
                          // Auto-detect based on number of answers
                          if (data[i].answers.length === 2 && 
                              data[i].answers.includes('True') && 
                              data[i].answers.includes('False')) {
                              data[i].type = 'true_false';
                          } else {
                              data[i].type = 'multiple_choice';
                          }
                      }

                      console.log(data[i]);
                      console.log("Type:", data[i].type)
                      
                      // Validate answer count based on type
                      if (data[i].type === 'multiple_choice' && data[i].answers.length !== 4) {
                          throw new Error(`Multiple choice question ${i + 1} must have exactly 4 answers`);
                      }
                      if (data[i].type === 'true_false' && data[i].answers.length !== 2) {
                          throw new Error(`True/False question ${i + 1} must have exactly 2 answers`);
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
          
          // For demo purposes, randomly assign correct answers
          this.correctAnswers = this.questions.map((q) => {
              if (q.type === 'true_false') {
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
          this.userAnswers = new Array(this.questions.length).fill(null);
          this.currentQuestionIndex = 0;
          this.quizCompleted = false;
          this.correctAnswers = this.questions.map((q) => {
              if (q.type === 'true_false') {
                  return Math.floor(Math.random() * 2);
              } else {
                  return Math.floor(Math.random() * 4);
              }
          });
          this.clearProgress();
      },
      getAnswerLabel(index) {
          if (this.currentQuestion.type === 'true_false') {
              return index === 0 ? 'T' : 'F';
          } else {
              return ['A', 'B', 'C', 'D'][index];
          }
      },
      getAnswerLabelForResult(question, qIndex, useCorrect = false) {
          const answerIndex = useCorrect ? this.correctAnswers[qIndex] : this.userAnswers[qIndex];
          if (question.type === 'true_false') {
              return answerIndex === 0 ? 'T' : 'F';
          } else {
              return ['A', 'B', 'C', 'D'][answerIndex];
          }
      },
      getQuestionTypeLabel() {
          return this.currentQuestion.type === 'true_false' ? 'True/False' : 'Multiple Choice';
      },
      getQuestionTypeBadgeClass() {
          return this.currentQuestion.type === 'true_false' ? 'badge-true-false' : 'badge-multiple-choice';
      },
      getQuestionTypeLabelForIndex(index) {
          return this.questions[index].type === 'true_false' ? 'True/False' : 'Multiple Choice';
      },
      getQuestionTypeBadgeClassForIndex(index) {
          return this.questions[index].type === 'true_false' ? 'badge-true-false' : 'badge-multiple-choice';
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
