<script setup>
/**
 * Quiz file upload component
 */

defineProps({
  uploadedQuizName: {
    type: String,
    default: ''
  },
  hasUploadedData: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['file-change', 'update:uploadedQuizName', 'save-quiz'])

function handleFileChange(event) {
  emit('file-change', event)
}

function handleNameInput(event) {
  emit('update:uploadedQuizName', event.target.value)
}
</script>

<template>
  <div class="upload-section">
    <div class="divider">OR</div>
    <div class="file-upload">
      <input
        type="file"
        id="fileInput"
        @change="handleFileChange"
        accept=".json"
      />
      <label for="fileInput">📁 Upload a new quiz JSON file</label>
      
      <div v-if="hasUploadedData" class="quiz-name-input">
        <label for="quizNameInput" class="input-label">Quiz Name:</label>
        <input
          id="quizNameInput"
          :value="uploadedQuizName"
          @input="handleNameInput"
          type="text"
          placeholder="Enter a name for this quiz"
          required
        />
        <button
          class="btn-save"
          @click="emit('save-quiz')"
          :disabled="!uploadedQuizName || !hasUploadedData"
        >
          💾 Save Quiz to Database
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.divider {
  text-align: center;
  margin: 20px 0;
  color: #999;
  position: relative;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
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

#fileInput {
  display: none;
}

.file-upload label {
  cursor: pointer;
  color: #667eea;
  font-weight: 600;
  font-size: 1.1em;
}

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
  text-align: left;
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

