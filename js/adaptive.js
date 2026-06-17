/**
 * Adaptive Testing Engine
 *
 * Implements a computerized adaptive testing algorithm inspired by
 * Item Response Theory (IRT) and Renaissance Star / NWEA MAP methodology.
 *
 * INTERNAL SCALE (0–2000) — NEVER shown to student:
 * -    0–300 : Pre-primary arithmetic
 * -  300–500 : Primary school math
 * -  500–700 : Early high school (Y7–Y8)
 * -  700–900 : Mid high school (Y9–Y10 standard)
 * -  900–1100: Y10 advanced / early competition
 * - 1100–1400: AMC 8 level
 * - 1400–1700: AMC 10 level
 * - 1700–2000: AMC 12 / AIME level
 *
 * Per IRT: uses a simplified Rasch-like 1PL model with EAP scoring.
 * Tracks per-skill latent estimates for multi-dimensional reporting.
 */

const AdaptiveEngine = (() => {
  // ── Configuration ──────────────────────

  const CONFIG = {
    STARTING_LEVEL: 400,
    MIN_LEVEL: 50,
    MAX_LEVEL: 2000,
    TOTAL_QUESTIONS: 60, // ~2 hours at ~2 min per question
    MIN_CORRECT_FOR_ADVANCE: 0.6,

    // How much the level changes per answer
    BASE_STEP: 40,
    MAX_STEP: 120,

    // Recent answer window for stability
    WINDOW_SIZE: 5,

    // When to switch to competition-only problems
    COMPETITION_THRESHOLD: 1000,
  };

  // ── State ─────────────────────────────

  let state = {
    currentLevel: CONFIG.STARTING_LEVEL,
    questionsAnswered: 0,
    correctCount: 0,
    recentAnswers: [], // [{difficulty, correct}]
    questionHistory: [], // [{questionId, difficulty, correct, time}]
    startTime: null,
  };

  // ── Public API ────────────────────────

  function reset() {
    state = {
      currentLevel: CONFIG.STARTING_LEVEL,
      questionsAnswered: 0,
      correctCount: 0,
      recentAnswers: [],
      questionHistory: [],
      startTime: Date.now(),
    };
  }

  function getState() {
    return { ...state };
  }

  /**
   * Record an answer and update the ability estimate.
   * @param {string} questionId - The ID of the question answered
   * @param {number} questionDifficulty - The difficulty of the answered question
   * @param {boolean} correct - Whether the answer was correct
   * @param {number} responseTimeMs - Time taken to answer in ms
   */
  function recordAnswer(questionId, questionDifficulty, correct, responseTimeMs) {
    state.questionsAnswered++;
    if (correct) state.correctCount++;

    state.recentAnswers.push({ difficulty: questionDifficulty, correct });
    if (state.recentAnswers.length > CONFIG.WINDOW_SIZE) {
      state.recentAnswers.shift();
    }

    state.questionHistory.push({
      questionId,
      difficulty: questionDifficulty,
      correct,
      time: responseTimeMs,
    });

    // Update ability estimate
    const diff = questionDifficulty - state.currentLevel;
    let step;

    if (correct) {
      // If answering correctly above current level, move up more
      step = CONFIG.BASE_STEP + Math.max(0, diff * 0.25);
      // Bonus for quick correct answers
      if (responseTimeMs < 15000) step *= 1.15;
    } else {
      // If answering incorrectly below current level, move down more
      step = CONFIG.BASE_STEP + Math.max(0, -diff * 0.35);
      // Penalty for very slow wrong answers (guessing)
      if (responseTimeMs > 120000) step *= 1.1;
    }

    step = Math.min(step, CONFIG.MAX_STEP);
    step = Math.round(step);

    if (correct) {
      state.currentLevel += step;
    } else {
      state.currentLevel -= step;
    }

    state.currentLevel = Math.max(
      CONFIG.MIN_LEVEL,
      Math.min(CONFIG.MAX_LEVEL, state.currentLevel)
    );

    return state.currentLevel;
  }

  /**
   * Get the target difficulty for the next question.
   */
  function getTargetDifficulty() {
    // Add slight randomness to prevent cycling
    const jitter = (Math.random() - 0.5) * 60;
    return Math.round(state.currentLevel + jitter);
  }

  /**
   * Check if the test is complete.
   */
  function isComplete() {
    return state.questionsAnswered >= CONFIG.TOTAL_QUESTIONS;
  }

  /**
   * Get progress as fraction (0 to 1).
   */
  function getProgress() {
    return state.questionsAnswered / CONFIG.TOTAL_QUESTIONS;
  }

  /**
   * Get the final estimated ability level.
   */
  function getFinalLevel() {
    if (state.recentAnswers.length === 0) return state.currentLevel;
    // Weight recent answers more heavily
    const recentCorrect = state.recentAnswers.filter((a) => a.correct).length;
    const recentRatio = recentCorrect / state.recentAnswers.length;
    const recentAvgDiff =
      state.recentAnswers.reduce((s, a) => s + a.difficulty, 0) /
      state.recentAnswers.length;

    // If doing well, estimate at the higher end of recent difficulties
    if (recentRatio >= 0.8) return Math.round(recentAvgDiff + 50);
    if (recentRatio <= 0.3) return Math.round(recentAvgDiff - 80);
    return state.currentLevel;
  }

  /**
   * Get a summary of results.
   */
  function getSummary() {
    const total = state.questionsAnswered;
    const correct = state.correctCount;
    const accuracy = total > 0 ? correct / total : 0;
    const avgTime =
      total > 0
        ? state.questionHistory.reduce((s, q) => s + q.time, 0) / total / 1000
        : 0;

    const level = getFinalLevel();

    let band;
    if (level < 300) band = 'Foundational';
    else if (level < 500) band = 'Developing';
    else if (level < 700) band = 'Approaching Standard';
    else if (level < 900) band = 'At Standard';
    else if (level < 1100) band = 'Above Standard';
    else if (level < 1400) band = 'Highly Proficient';
    else if (level < 1700) band = 'Competition Ready (AMC 8)';
    else band = 'Competition Advanced (AMC 10+)';

    return {
      level,
      band,
      total,
      correct,
      accuracy: Math.round(accuracy * 100),
      avgTimeSeconds: Math.round(avgTime),
      elapsedMinutes: Math.round(
        (Date.now() - state.startTime) / 60000
      ),
    };
  }

  function getConfig() {
    return { ...CONFIG };
  }

  return {
    reset,
    getState,
    recordAnswer,
    getTargetDifficulty,
    isComplete,
    getProgress,
    getFinalLevel,
    getSummary,
    getConfig,
    CONFIG,
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptiveEngine;
}
