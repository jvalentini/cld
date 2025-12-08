## 1. Implementation
- [ ] 1.1 Verify/Enable Supabase Realtime Replication for `quizzes` and `submissions` tables.
- [ ] 1.2 Update `useQuiz.js` to subscribe to `INSERT`, `UPDATE`, `DELETE` events on `quizzes` table and update `availableQuizzes` list.
- [ ] 1.3 Update `useStatistics.js` to subscribe to `INSERT` events on `submissions` table and trigger `loadAllQuizStats` (or currently active stat loader).
- [ ] 1.4 Add visual indicator (optional toast or flash) when updates occur to inform user.

## 2. Verification
- [ ] 2.1 E2E Test: Open two browser windows. Add a quiz in one. Verify it appears in the other.
- [ ] 2.2 E2E Test: Open two browser windows. Submit a quiz in one. Verify leaderboard/stats update in the other.
