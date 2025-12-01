<template>
  <div class="leaderboard-container">
    <h2>🏆 Leaderboards</h2>
    
    <div class="leaderboard-tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'quiz' }"
        @click="activeTab = 'quiz'"
      >
        Top Scores by Quiz
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'users' }"
        @click="activeTab = 'users'"
      >
        Most Active Users
      </button>
    </div>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="loading" class="loading">Loading leaderboards...</div>
    
    <!-- Quiz Leaderboard Tab -->
    <div v-if="activeTab === 'quiz' && !loading" class="leaderboard-content">
      <div class="quiz-selector-section">
        <label for="quizSelect">Select Quiz:</label>
        <select id="quizSelect" v-model="selectedQuizId" @change="loadQuizLeaderboard">
          <option value="">-- All Quizzes --</option>
          <option 
            v-for="quiz in availableQuizzes" 
            :key="quiz.quiz_id"
            :value="quiz.quiz_id"
          >
            {{ quiz.quiz_name }}
          </option>
        </select>
      </div>
      
      <div v-if="quizLeaderboard.length === 0" class="no-data">
        No submissions found for this quiz yet.
      </div>
      
      <div v-else class="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th class="user-col">User</th>
              <th v-if="!selectedQuizId" class="quiz-col">Quiz</th>
              <th class="score-col">Score</th>
              <th class="percentage-col">Percentage</th>
              <th class="date-col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(entry, index) in displayedQuizLeaderboard" 
              :key="`${entry.quiz_id}-${entry.user_id}-${entry.submitted_at}`"
              :class="getRankClass(entry.rank || index + 1)"
            >
              <td class="rank-col">
                <span class="rank-badge">{{ entry.rank || index + 1 }}</span>
              </td>
              <td class="user-col">
                <div class="user-info">
                  <span class="username">{{ entry.username }}</span>
                  <span class="full-name">{{ entry.full_name }}</span>
                </div>
              </td>
              <td v-if="!selectedQuizId" class="quiz-col">
                {{ entry.quiz_name }}
              </td>
              <td class="score-col">
                {{ entry.correct_answers }} / {{ entry.total_questions }}
              </td>
              <td class="percentage-col">
                <span class="percentage-badge" :class="getScoreClass(entry.score_percentage)">
                  {{ entry.score_percentage }}%
                </span>
              </td>
              <td class="date-col">
                {{ formatDate(entry.submitted_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- User Activity Leaderboard Tab -->
    <div v-if="activeTab === 'users' && !loading" class="leaderboard-content">
      <div v-if="userLeaderboard.length === 0" class="no-data">
        No user activity data available yet.
      </div>
      
      <div v-else class="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th class="user-col">User</th>
              <th class="count-col">Total Quizzes</th>
              <th class="avg-col">Avg Score</th>
              <th class="score-col">Best Score</th>
              <th class="date-col">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(user, index) in userLeaderboard" 
              :key="user.user_id"
              :class="getRankClass(index + 1)"
            >
              <td class="rank-col">
                <span class="rank-badge">{{ index + 1 }}</span>
              </td>
              <td class="user-col">
                <div class="user-info">
                  <span class="username">{{ user.username }}</span>
                  <span class="full-name">{{ user.full_name }}</span>
                </div>
              </td>
              <td class="count-col">
                <span class="count-badge">{{ user.total_submissions }}</span>
              </td>
              <td class="avg-col">
                <span class="percentage-badge" :class="getScoreClass(user.average_score)">
                  {{ user.average_score }}%
                </span>
              </td>
              <td class="score-col">
                {{ user.highest_score }}%
              </td>
              <td class="date-col">
                {{ formatDate(user.last_submission) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabaseClient'

export default {
  name: 'LeaderboardView',
  data() {
    return {
      activeTab: 'quiz', // 'quiz' or 'users'
      quizLeaderboard: [],
      userLeaderboard: [],
      availableQuizzes: [],
      selectedQuizId: '',
      loading: false,
      error: null
    }
  },
  computed: {
    displayedQuizLeaderboard() {
      if (!this.selectedQuizId) {
        // Show top 10 across all quizzes
        return this.quizLeaderboard.slice(0, 10)
      }
      // Show top 10 for selected quiz
      return this.quizLeaderboard.filter(e => e.quiz_id === parseInt(this.selectedQuizId)).slice(0, 10)
    }
  },
  mounted() {
    this.loadLeaderboards()
  },
  methods: {
    async loadLeaderboards() {
      this.loading = true
      this.error = null
      
      try {
        await Promise.all([
          this.loadQuizLeaderboard(),
          this.loadUserLeaderboard(),
          this.loadAvailableQuizzes()
        ])
      } catch (err) {
        console.error('Error loading leaderboards:', err)
        this.error = `Failed to load leaderboards: ${err.message}`
      } finally {
        this.loading = false
      }
    },
    
    async loadQuizLeaderboard() {
      try {
        let query = supabase
          .from('quiz_leaderboard')
          .select('*')
        
        if (this.selectedQuizId) {
          query = query.eq('quiz_id', this.selectedQuizId)
        }
        
        const { data, error } = await query.limit(100)
        
        if (error) throw error
        
        this.quizLeaderboard = data || []
      } catch (err) {
        console.error('Error loading quiz leaderboard:', err)
        throw err
      }
    },
    
    async loadUserLeaderboard() {
      try {
        const { data, error } = await supabase
          .from('user_activity_leaderboard')
          .select('*')
          .limit(100)
        
        if (error) throw error
        
        this.userLeaderboard = data || []
      } catch (err) {
        console.error('Error loading user leaderboard:', err)
        throw err
      }
    },
    
    async loadAvailableQuizzes() {
      try {
        const { data, error } = await supabase
          .from('quiz_statistics')
          .select('quiz_id, quiz_name')
          .order('quiz_name')
        
        if (error) throw error
        
        this.availableQuizzes = data || []
      } catch (err) {
        console.error('Error loading quizzes:', err)
        throw err
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    
    getRankClass(rank) {
      if (rank === 1) return 'rank-gold'
      if (rank === 2) return 'rank-silver'
      if (rank === 3) return 'rank-bronze'
      return ''
    },
    
    getScoreClass(percentage) {
      if (percentage >= 90) return 'score-excellent'
      if (percentage >= 70) return 'score-good'
      if (percentage >= 50) return 'score-ok'
      return 'score-poor'
    }
  }
}
</script>

<style scoped>
.leaderboard-container {
  padding: 20px 0;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 32px;
}

/* Tabs */
.leaderboard-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

.tab-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #495057;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

/* Quiz Selector */
.quiz-selector-section {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.quiz-selector-section label {
  font-weight: 600;
  color: #495057;
}

.quiz-selector-section select {
  flex: 1;
  max-width: 400px;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* Table Styles */
.leaderboard-table {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

th {
  padding: 15px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 15px 10px;
  border-bottom: 1px solid #f0f0f0;
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background: #f8f9ff;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Rank styling */
.rank-col {
  width: 80px;
  text-align: center;
}

.rank-badge {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 50%;
  background: #e9ecef;
  font-weight: 700;
  font-size: 16px;
  color: #495057;
}

.rank-gold .rank-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.4);
}

.rank-silver .rank-badge {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  color: #333;
  box-shadow: 0 4px 10px rgba(192, 192, 192, 0.4);
}

.rank-bronze .rank-badge {
  background: linear-gradient(135deg, #cd7f32 0%, #e6a857 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(205, 127, 50, 0.4);
}

/* User info */
.user-col {
  min-width: 200px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.full-name {
  font-size: 13px;
  color: #6c757d;
}

/* Quiz column */
.quiz-col {
  min-width: 200px;
  color: #495057;
  font-weight: 500;
}

/* Score columns */
.score-col, .count-col, .avg-col {
  text-align: center;
  font-weight: 600;
  color: #495057;
}

.count-badge {
  display: inline-block;
  padding: 6px 14px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
}

/* Percentage badges */
.percentage-col {
  text-align: center;
}

.percentage-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
}

.score-excellent {
  background: #d1fae5;
  color: #065f46;
}

.score-good {
  background: #dbeafe;
  color: #1e40af;
}

.score-ok {
  background: #fef3c7;
  color: #92400e;
}

.score-poor {
  background: #fee2e2;
  color: #991b1b;
}

/* Date column */
.date-col {
  text-align: right;
  color: #6c757d;
  font-size: 13px;
  min-width: 120px;
}

/* States */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 18px;
}

.error {
  color: #ef4444;
  padding: 15px;
  background: #fee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

/* Responsive */
@media (max-width: 768px) {
  .leaderboard-tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    width: 100%;
  }
  
  .quiz-selector-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quiz-selector-section select {
    max-width: 100%;
  }
  
  table {
    font-size: 13px;
  }
  
  th, td {
    padding: 10px 6px;
  }
  
  .rank-badge {
    width: 32px;
    height: 32px;
    line-height: 32px;
    font-size: 14px;
  }
}
</style>