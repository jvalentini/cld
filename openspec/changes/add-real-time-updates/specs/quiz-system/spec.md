## ADDED Requirements

### Requirement: Real-Time Quiz Availability
The system SHALL automatically update the list of available quizzes in the user interface when a new quiz is added to the database.

#### Scenario: User sees new quiz without refresh
- **GIVEN** a user is viewing the quiz list
- **WHEN** a new quiz is inserted into the database (e.g., by the parser)
- **THEN** the new quiz appears in the list immediately without a page reload

### Requirement: Real-Time Leaderboard Updates
The system SHALL automatically update the leaderboard and statistics when a new submission is recorded.

#### Scenario: User sees updated stats
- **GIVEN** a user is viewing the leaderboard
- **WHEN** another user completes a quiz and a submission is recorded
- **THEN** the leaderboard statistics update to reflect the new score
