# Change: Add Real-Time Updates

## Why
Currently, the quiz application relies on manual page refreshes or initial page loads to fetch data. This means:
- Users do not see new quizzes when they are uploaded/published by admins unless they refresh.
- The leaderboard and statistics are stale until a refresh, reducing the competitive engagement element.

Adding real-time updates will improve user experience and engagement by making the platform feel alive and responsive.

## What Changes
- Enable Supabase Realtime subscriptions in the frontend application.
- `useQuiz` composable will automatically update the list of available quizzes when `quizzes` table changes.
- `useStatistics` composable will automatically refetch statistics when `submissions` table changes.

## Impact
- **Affected Specs**: `quiz-system`
- **Affected Code**: 
    - `quiz-app/src/composables/useQuiz.js`
    - `quiz-app/src/composables/useStatistics.js`
- **Infrastructure**: Requires Supabase Replication (Realtime) to be enabled for `quizzes` and `submissions` tables.
