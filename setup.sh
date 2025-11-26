#!/bin/bash
# Script to generate all project files

echo "Creating Vue Quiz App project structure..."

# Create directory structure
mkdir -p quiz-app/src
cd quiz-app

# ====================
# package.json
# ====================
cat > package.json << 'EOF'
{
  "name": "quiz-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
EOF

# ====================
# vite.config.js
# ====================
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  }
})
EOF

# ====================
# index.html
# ====================
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz App</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
EOF

# ====================
# nginx.conf
# ====================
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# ====================
# Dockerfile
# ====================
cat > Dockerfile << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config from build context (not from builder stage)
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# ====================
# docker-compose.yml
# ====================
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  quiz-app:
    build: .
    ports:
      - "8080:80"
    container_name: quiz-app
    restart: unless-stopped
EOF

# ====================
# .dockerignore
# ====================
cat > .dockerignore << 'EOF'
node_modules
dist
.git
.gitignore
*.md
.env
.DS_Store
EOF

# ====================
# src/main.js
# ====================
cat > src/main.js << 'EOF'
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
EOF

# ====================
# src/App.vue
# ====================
cat > src/App.vue << 'EOF'
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
EOF

# ====================
# src/style.css
# ====================
cat > src/style.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2em;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.file-upload {
  margin-bottom: 30px;
  padding: 30px;
  border: 3px dashed #667eea;
  border-radius: 12px;
  text-align: center;
  background: #f8f9ff;
  transition: all 0.3s;
}

.file-upload:hover {
  border-color: #764ba2;
  background: #f0f1ff;
}

.file-upload input {
  display: none;
}

.file-upload label {
  cursor: pointer;
  color: #667eea;
  font-weight: 600;
  font-size: 1.1em;
}

.progress-bar {
  background: #e0e0e0;
  border-radius: 10px;
  height: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-weight: 500;
}

.question-card {
  margin-bottom: 30px;
}

.question-number {
  color: #667eea;
  font-weight: 700;
  font-size: 0.9em;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.question-text {
  font-size: 1.3em;
  color: #333;
  margin-bottom: 25px;
  line-height: 1.5;
}

.answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-option {
  padding: 18px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
}

.answer-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.answer-option.selected {
  border-color: #667eea;
  background: #f0f1ff;
  font-weight: 600;
}

.answer-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  font-weight: 700;
  flex-shrink: 0;
}

.answer-option.selected .answer-label {
  background: #667eea;
  color: white;
}

.answer-text {
  flex: 1;
  color: #333;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 15px;
}

button {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.results {
  text-align: center;
}

.score {
  font-size: 3em;
  color: #667eea;
  font-weight: 700;
  margin: 30px 0;
}

.results-detail {
  margin-top: 40px;
  text-align: left;
}

.result-item {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 10px;
  background: #f8f9ff;
}

.result-question {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.result-answer {
  color: #666;
  padding-left: 20px;
}

.result-answer.correct {
  color: #10b981;
}

.result-answer.incorrect {
  color: #ef4444;
}

.error {
  color: #ef4444;
  padding: 15px;
  background: #fee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.reset-btn {
  margin-top: 20px;
}
EOF

# ====================
# README.md
# ====================
cat > README.md << 'EOF'
# Vue Quiz App

A containerized Vue 3 quiz application.

## Quick Start

### Build and run with Docker:
```bash
docker build -t quiz-app .
docker run -p 8080:80 quiz-app
```

### Or use Docker Compose:
```bash
docker-compose up --build
```

Then open http://localhost:8080 in your browser.

## Testing

Create a sample quiz file (sample-quiz.json):
```json
[
  {
    "question": "What is the capital of France?",
    "answers": [
      "London",
      "Paris",
      "Berlin",
      "Madrid"
    ]
  },
  {
    "question": "What is 2 + 2?",
    "answers": [
      "3",
      "4",
      "5",
      "6"
    ]
  },
  {
    "question": "Which planet is closest to the Sun?",
    "answers": [
      "Venus",
      "Earth",
      "Mercury",
      "Mars"
    ]
  }
]
```

Upload this file to test the quiz app.

## Project Structure
```
quiz-app/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.js
├── nginx.conf
├── index.html
└── src/
    ├── main.js
    ├── App.vue
    └── style.css
```

## Features
- Upload quiz JSON files
- Progress tracking with localStorage
- Resume capability
- Results review

## Troubleshooting

If nothing happens when uploading:
1. Open browser console (F12 → Console)
2. Check for error messages
3. Verify JSON file format matches the example above
4. Ensure each question has exactly 4 answers
EOF

# ====================
# Create sample quiz file
# ====================
cat > sample-quiz.json << 'EOF'
[
  {
    "question": "What is the capital of France?",
    "answers": [
      "London",
      "Paris",
      "Berlin",
      "Madrid"
    ]
  },
  {
    "question": "What is 2 + 2?",
    "answers": [
      "3",
      "4",
      "5",
      "6"
    ]
  },
  {
    "question": "Which planet is closest to the Sun?",
    "answers": [
      "Venus",
      "Earth",
      "Mercury",
      "Mars"
    ]
  },
  {
    "question": "What is the largest ocean on Earth?",
    "answers": [
      "Atlantic Ocean",
      "Indian Ocean",
      "Arctic Ocean",
      "Pacific Ocean"
    ]
  },
  {
    "question": "Who painted the Mona Lisa?",
    "answers": [
      "Vincent van Gogh",
      "Leonardo da Vinci",
      "Pablo Picasso",
      "Michelangelo"
    ]
  }
]
EOF

echo ""
echo "✅ Project structure created successfully!"
echo ""
echo "Next steps:"
echo "  cd quiz-app"
echo "  docker build -t quiz-app ."
echo "  docker run -p 8080:80 quiz-app"
echo ""
echo "Or use Docker Compose:"
echo "  cd quiz-app"
echo "  docker-compose up --build"