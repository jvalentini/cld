# Design: Real-Time Updates

## Context
The application uses Supabase (PostgreSQL) as the backend. Supabase provides built-in Realtime capabilities via PostgreSQL WAL replication, which the JavaScript client can subscribe to.

## Goals
- **Responsiveness**: UI updates immediately (< 1s) when data changes in the database.
- **Efficiency**: Only fetch necessary data when changes occur.

## Decisions
- **Decision**: Use `postgres_changes` channel subscription.
    - **Rationale**: Native Supabase feature, straightforward implementation in the existing `supabase-js` client.
- **Decision**: For Statistics, Subscribe to `submissions` table, Refetch Views.
    - **Rationale**: Statistics are derived from views (`quiz_statistics`, `quiz_leaderboard`). Watching a view directly in Realtime is not standard/efficient. Since statistics change when a *submission* happens, we will listen for inserts on the `submissions` table. When an insert occurs, we will re-trigger the data fetch functions (`loadAllQuizStats`, etc.). This avoids complex client-side calculation replication.
- **Decision**: Global Subscription Management.
    - **Rationale**: Subscriptions should be set up when the composable is used (mounted) and cleaned up when unmounted (or app closed) to avoid memory leaks.

## Risks / Trade-offs
- **Connection Limits**: Supabase Realtime has connection limits, but for this scale/project type it is acceptable.
- **Refetching Stats**: Refetching the entire stat set on every submission might be heavy if high-frequency submissions occur.
    - **Mitigation**: Debounce the refetch if necessary, but given current scale, simple refetch is fine (Straightforward implementation first).

## Open Questions
- Is Replication enabled on the production database? (Must be verified in tasks).
