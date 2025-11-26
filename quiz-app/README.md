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
