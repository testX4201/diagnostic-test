/**
 * Diagnostic Test — Main Application (v3)
 * - Pause/Resume button
 * - Server-side TikZ → PNG rendering
 * - No PIN on student UI — auto-download encrypted report
 * - Stopwatch, hidden scale, skill tracking
 */

const App = (() => {
  // ── DOM ────────────────────────────────

  const dom = {
    header: document.getElementById('header'),
    headerMeta: document.getElementById('header-meta'),
    main: document.getElementById('main-content'),
    footer: document.getElementById('footer'),
  };

  // ── State ──────────────────────────────

  let currentQuestion = null;
  let questionStartTime = null;
  let selectedOption = null;
  let answered = false;
  let usedQuestionIds = new Set();
  let questionHistory = [];
  let stopwatchInterval = null;
  let testStartTime = null;
  let paused = false;
  let pauseStartTime = null;
  let totalPausedMs = 0;
  let savedQuestionHTML = null;

  // ── Init ───────────────────────────────

  function init() {
    stopStopwatch();
    AdaptiveEngine.reset();
    usedQuestionIds = new Set();
    questionHistory = [];
    testStartTime = null;
    paused = false;
    totalPausedMs = 0;
    updateHeaderStopwatch(false);
    renderLanding();
  }

  // ── Stopwatch ──────────────────────────

  function startStopwatch() {
    testStartTime = Date.now();
    totalPausedMs = 0;
    updateHeaderStopwatch(true);
    stopwatchInterval = setInterval(updateStopwatchDisplay, 1000);
  }

  function stopStopwatch() {
    if (stopwatchInterval) { clearInterval(stopwatchInterval); stopwatchInterval = null; }
  }

  function updateHeaderStopwatch(visible) {
    if (dom.headerMeta) {
      if (visible) {
        dom.headerMeta.innerHTML = '<span id="stopwatch" style="font-weight:700;">00:00</span>';
      } else {
        dom.headerMeta.textContent = 'NSW MATHEMATICS SYLLABUS';
      }
    }
  }

  function updateStopwatchDisplay() {
    const el = document.getElementById('stopwatch');
    if (!el || !testStartTime || paused) return;
    const elapsed = Math.floor((Date.now() - testStartTime - totalPausedMs) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    el.textContent = m + ':' + s;
  }

  function getElapsedString() {
    if (!testStartTime) return '0s';
    const elapsed = Math.floor((Date.now() - testStartTime - totalPausedMs) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return m === 0 ? s + 's' : m + 'min ' + s + 's';
  }

  // ── Pause / Resume ─────────────────────

  function togglePause() {
    if (paused) {
      resumeTest();
    } else {
      pauseTest();
    }
  }

  function pauseTest() {
    if (paused || answered) return;
    paused = true;
    pauseStartTime = Date.now();
    savedQuestionHTML = dom.main.innerHTML;
    dom.main.innerHTML = `
      <div class="landing" style="align-items:center;text-align:center;padding-top:3rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">&#9646;&#9646;</div>
        <h2 style="font-size:1.4rem;">Test Paused</h2>
        <div class="info-block">
          <p>The timer has been stopped. Your progress is saved.</p>
          <p>Questions answered: <strong>${AdaptiveEngine.getState().questionsAnswered}</strong> of <strong>${AdaptiveEngine.CONFIG.TOTAL_QUESTIONS}</strong></p>
          <p>When you return, you will continue from where you left off. The current question will be shown again.</p>
        </div>
        <button class="btn btn-primary btn-block" onclick="App.togglePause()">RESUME TEST</button>
      </div>
    `;
  }

  function resumeTest() {
    if (!paused) return;
    paused = false;
    totalPausedMs += Date.now() - pauseStartTime;
    pauseStartTime = null;
    dom.main.innerHTML = savedQuestionHTML;
    savedQuestionHTML = null;
    updateStopwatchDisplay();
    // Re-bind event listeners
    document.querySelectorAll('.option').forEach(el => {
      const marker = el.getAttribute('data-marker');
      if (marker) el.setAttribute('onclick', `App.selectOption('${marker}')`);
    });
    const input = document.getElementById('numeric-answer');
    if (input && !answered) {
      input.addEventListener('input', () => {
        const btn = document.getElementById('submit-btn');
        if (btn) btn.disabled = !input.value.trim();
      });
    }
    updateSubmitButton();
  }

  // ── Landing ────────────────────────────

  function renderLanding() {
    dom.main.innerHTML = `
      <div class="landing">
        <div><div class="subtitle">NSW Year 10 Mathematics</div>
        <h1>Adaptive Diagnostic<br>Assessment</h1></div>
        <div class="info-block">
          <p>This diagnostic test adapts to <strong>your</strong> ability in real time.
          As you answer correctly, questions become more challenging.
          If you struggle, they adjust downward to pinpoint your exact level.</p>
          <p><strong>${AdaptiveEngine.CONFIG.TOTAL_QUESTIONS} questions</strong> &middot;
          Approximately <strong>2 hours</strong></p>
        </div>
        <div class="info-block">
          <p><strong>Instructions:</strong></p>
          <p>&mdash; Work through each question carefully.<br>
          &mdash; Some questions require a typed numeric answer; others are multiple choice.<br>
          &mdash; You cannot go back to previous questions.<br>
          &mdash; You may pause at any time and resume later.<br>
          &mdash; There is no penalty for wrong answers.</p>
        </div>
        <button class="btn btn-primary btn-block" onclick="App.startTest()">BEGIN DIAGNOSTIC</button>
      </div>`;
  }

  // ── Question ───────────────────────────

  function renderQuestion(question) {
    currentQuestion = question;
    questionStartTime = Date.now();
    selectedOption = null;
    answered = false;
    savedQuestionHTML = null;

    const qNum = AdaptiveEngine.getState().questionsAnswered + 1;
    const total = AdaptiveEngine.CONFIG.TOTAL_QUESTIONS;
    const progress = AdaptiveEngine.getProgress() * 100;

    let optionsHtml = '';
    if (question.type === 'multiple-choice' && question.options) {
      optionsHtml = `
        <ul class="options" id="options-list">
          ${question.options.map(opt => `
            <li class="option" data-marker="${opt.marker}" onclick="App.selectOption('${opt.marker}')">
              <span class="option-marker">${opt.marker}</span>
              <span class="option-text">${renderMath(opt.text)}</span>
            </li>`).join('')}
        </ul>`;
    } else {
      optionsHtml = `
        <div class="answer-input-wrap">
          <input type="text" id="numeric-answer" placeholder="Enter your answer..."
                 autocomplete="off" spellcheck="false"
                 onkeydown="if(event.key==='Enter')App.submitAnswer()">
        </div>`;
    }

    let figureHtml = '';
    if (question.figureTikz) {
      figureHtml = `<div class="figure-container">
        <img src="img/diagram-${question.id}.png" alt="Figure" style="max-width:100%;">
      </div>`;
    }

    dom.main.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div class="progress-wrap" style="flex:1;margin-bottom:0;margin-right:1rem;">
          <div class="progress-bar" style="width:${progress}%;"></div>
          <div class="progress-label"><span>Question ${qNum} of ${total}</span><span>${Math.round(progress)}%</span></div>
        </div>
        <button class="btn" onclick="App.togglePause()" style="padding:0.5rem 0.75rem;font-size:0.65rem;white-space:nowrap;" id="pause-btn">PAUSE</button>
      </div>
      <div class="question-card" id="question-card">
        <div class="question-number">QUESTION ${qNum}</div>
        <div class="question-text">${renderMath(question.questionText)}</div>
        ${figureHtml}
        ${optionsHtml}
      </div>
      <div id="feedback-area"><div class="feedback" id="feedback-box"></div></div>
      <div style="margin-top:1rem;">
        <button class="btn btn-primary btn-block" id="submit-btn" onclick="App.submitAnswer()" disabled>SUBMIT ANSWER</button>
      </div>`;

    updateSubmitButton();

    if (question.type === 'numeric') {
      setTimeout(() => { const inp = document.getElementById('numeric-answer'); if (inp) inp.focus(); }, 100);
    }
  }

  // ── Results ────────────────────────────

  function renderResults() {
    stopStopwatch();
    updateHeaderStopwatch(false);
    const summary = AdaptiveEngine.getSummary();
    const elapsed = getElapsedString();

    dom.main.innerHTML = `
      <div class="results">
        <h2>Assessment Complete</h2>
        <div class="score-block">
          <div class="score-value" style="font-size:2rem;font-family:var(--font-sans);">${summary.band}</div>
          <div class="score-label">Performance Band</div>
        </div>
        <div class="breakdown">
          <div class="breakdown-row"><span>Questions Answered</span><span class="breakdown-val">${summary.total}</span></div>
          <div class="breakdown-row"><span>Correct Answers</span><span class="breakdown-val">${summary.correct}</span></div>
          <div class="breakdown-row"><span>Accuracy</span><span class="breakdown-val">${summary.accuracy}%</span></div>
          <div class="breakdown-row"><span>Time Taken</span><span class="breakdown-val">${elapsed}</span></div>
        </div>
        <div class="info-block">
          <p><strong>Performance Band: ${summary.band}</strong></p>
          <p>This reflects your current level on the NSW Y10 mathematics syllabus.
          Download the encrypted results file below to send to your tutor.</p>
        </div>
        <div class="info-block">
          <p><strong>Download Results File</strong></p>
          <p>Click below to download your encrypted diagnostic report. Give this file to your tutor.</p>
          <button class="btn btn-primary btn-block" onclick="App.downloadReport()" style="margin-top:0.5rem;">DOWNLOAD ENCRYPTED REPORT</button>
          <p id="dl-status" style="font-size:0.75rem;margin-top:0.5rem;color:var(--muted);"></p>
        </div>
        <button class="btn btn-block" onclick="App.init()">TAKE AGAIN</button>
      </div>`;
  }

  // ── Actions ────────────────────────────

  function startTest() {
    AdaptiveEngine.reset();
    usedQuestionIds = new Set();
    questionHistory = [];
    paused = false;
    totalPausedMs = 0;
    startStopwatch();
    loadNextQuestion();
  }

  function loadNextQuestion() {
    if (AdaptiveEngine.isComplete()) { renderResults(); return; }
    const question = QuestionBank.getNextQuestion(AdaptiveEngine.getTargetDifficulty(), usedQuestionIds);
    if (!question) { renderResults(); return; }
    usedQuestionIds.add(question.id);
    renderQuestion(question);
  }

  function selectOption(marker) {
    if (answered || paused) return;
    document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
    const el = document.querySelector(`.option[data-marker="${marker}"]`);
    if (el) el.classList.add('selected');
    selectedOption = marker;
    updateSubmitButton();
  }

  function submitAnswer() {
    if (answered || !currentQuestion || paused) return;
    let userAnswer;
    if (currentQuestion.type === 'numeric') {
      const input = document.getElementById('numeric-answer');
      if (!input) return;
      userAnswer = input.value.trim();
      if (!userAnswer) return;
    } else {
      if (!selectedOption) return;
      userAnswer = selectedOption;
    }

    answered = true;
    const responseTime = Date.now() - questionStartTime;

    let isCorrect;
    if (currentQuestion.type === 'numeric') {
      const correctStr = currentQuestion.correctAnswer;
      // If the correct answer is a pure number, do numeric comparison
      if (/^-?[\d.]+$/.test(correctStr)) {
        const un = parseFloat(userAnswer);
        const cn = parseFloat(correctStr);
        isCorrect = !isNaN(un) && Math.abs(un - cn) < 0.001;
      } else {
        // Expression answer — use algebraic equivalence checker
        isCorrect = checkAlgebraicEquivalence(userAnswer, correctStr);
      }
    } else {
      isCorrect = userAnswer === currentQuestion.correctAnswer;
    }

    AdaptiveEngine.recordAnswer(currentQuestion.id, currentQuestion.difficulty, isCorrect, responseTime);
    questionHistory.push({ questionId: currentQuestion.id, correct: isCorrect, difficulty: currentQuestion.difficulty, time: responseTime });

    showFeedback(isCorrect);
    disableInputs();
    document.getElementById('pause-btn').style.display = 'none';

    const btn = document.getElementById('submit-btn');
    if (btn) {
      btn.textContent = 'CONTINUE →';
      btn.disabled = false;
      btn.onclick = () => loadNextQuestion();
    }
  }

  function showFeedback(isCorrect) {
    const fb = document.getElementById('feedback-box');
    if (!fb) return;
    fb.className = 'feedback show ' + (isCorrect ? 'correct-fb' : 'wrong-fb');
    fb.innerHTML = `<div class="feedback-label">${isCorrect ? 'CORRECT' : 'INCORRECT'}</div><div>${renderMath(currentQuestion.explanation || '')}</div>`;

    if (currentQuestion.type === 'multiple-choice') {
      const cel = document.querySelector(`.option[data-marker="${currentQuestion.correctAnswer}"]`);
      if (cel) cel.classList.add('correct');
      if (!isCorrect && selectedOption) {
        const wel = document.querySelector(`.option[data-marker="${selectedOption}"]`);
        if (wel) wel.classList.add('wrong');
      }
    }
  }

  function disableInputs() {
    document.querySelectorAll('.option').forEach(el => { el.style.pointerEvents = 'none'; });
    const inp = document.getElementById('numeric-answer');
    if (inp) inp.disabled = true;
  }

  function updateSubmitButton() {
    const btn = document.getElementById('submit-btn');
    if (!btn) return;
    if (currentQuestion.type === 'numeric') {
      const inp = document.getElementById('numeric-answer');
      btn.disabled = !inp || !inp.value.trim();
    } else {
      btn.disabled = !selectedOption;
    }
  }

  // ── Algebraic Equivalence Checker ─────

  /**
   * Check if two algebraic expressions are equivalent by evaluating
   * them at multiple test points. Handles implicit multiplication,
   * ^ for exponentiation, and basic trig functions.
   */
  function checkAlgebraicEquivalence(user, correct) {
    // Quick exact match
    const normUser = normalizeExpr(user);
    const normCorrect = normalizeExpr(correct);
    if (normUser === normCorrect) return true;

    // Evaluate at multiple test points
    const testVals = [-3, -2, -1, 0, 1, 2, 3, 5, 7];
    try {
      for (const x of testVals) {
        const uv = safeEval(user, x);
        const cv = safeEval(correct, x);
        if (uv === null || cv === null) return false;
        if (Math.abs(uv - cv) > 1e-6) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function normalizeExpr(expr) {
    return expr
      .replace(/\s+/g, '')
      .replace(/\^/g, '^')
      .replace(/\*\*/g, '^')
      .replace(/\{\\left\(/g, '(')
      .replace(/\\right\)\}/g, ')')
      .toLowerCase();
  }

  function safeEval(expr, xVal) {
    // Prepare expression for evaluation
    let e = expr
      .replace(/\s+/g, '')
      .replace(/\^/g, '**')       // ^ → **
      .replace(/\*\*/g, '**')      // already **
      .replace(/(\d)([a-zA-Z])/g, '$1*$2')  // 2x → 2*x
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')  // x2 → x*2 (unlikely but safe)
      .replace(/\)\(/g, ')*(')     // )( → )*(
      .replace(/(\d)\(/g, '$1*(')  // 2( → 2*(
      .replace(/\)(\d)/g, ')*$1')  // )2 → )*2
      .replace(/\)([a-zA-Z])/g, ')*$1'); // )x → )*x

    // Replace variables with values (only x, y, a, b supported)
    e = e.replace(/x/g, `(${xVal})`);
    e = e.replace(/y/g, `(${xVal + 0.5})`);
    e = e.replace(/a/g, `(${xVal + 1})`);
    e = e.replace(/b/g, `(${xVal - 1})`);

    // Only evaluate if expression looks safe
    if (/[^0-9+\-*/()., ]/.test(e.replace(/\*\*/g, ''))) return null;

    try {
      const result = Function('"use strict"; return (' + e + ')')();
      return typeof result === 'number' && isFinite(result) ? result : null;
    } catch (err) {
      return null;
    }
  }

  // ── Report Download (no PIN visible) ───

  const TUTOR_PIN = 'tutor-secret-2026'; // Change this for your students

  async function downloadReport() {
    const statusEl = document.getElementById('dl-status');
    try {
      const report = buildFullReport();
      const blob = await ReportGenerator.encryptReport(report, TUTOR_PIN);
      ReportGenerator.downloadBlob(blob, `diagnostic-report-${Date.now()}.enc`);
      if (statusEl) statusEl.textContent = 'Report downloaded. Send this .enc file to your tutor.';
    } catch (err) {
      if (statusEl) statusEl.textContent = 'Error: ' + err.message;
    }
  }

  function buildFullReport() {
    const es = AdaptiveEngine.getSummary();
    const aq = questionHistory.map(h => ({ questionId: h.questionId, correct: h.correct, difficulty: h.difficulty, time: h.time }));
    const rc = SkillTaxonomy.generateReportCard(aq);
    return {
      meta: { testName: 'NSW Y10 Mathematics Diagnostic Assessment', date: new Date().toISOString(), version: '1.0', totalQuestions: es.total, totalCorrect: es.correct, accuracy: es.accuracy, estimatedLevel: es.level, performanceBand: es.band, elapsedMinutes: es.elapsedMinutes, avgTimeSeconds: es.avgTimeSeconds },
      skillReport: rc,
      questionLog: aq.map((q, i) => { const skills = SkillTaxonomy.getSkillsForQuestion(q.questionId); return { index: i + 1, questionId: q.questionId, difficulty: q.difficulty, correct: q.correct, timeMs: q.time, skills: skills.map(s => ({ id: s.skillId, name: s.skillName, domain: s.domainName, topic: s.topicName })) }; }),
    };
  }

  function getQuestionHistory() { return questionHistory; }

  // ── Math Rendering ─────────────────────

  function renderMath(text) {
    if (!text) return '';
    if (typeof katex === 'undefined') return escapeHTML(text);
    const ESC = '\u0000$';
    let processed = text.replace(/\\\$/g, ESC);
    let result = '', remaining = processed;
    while (remaining.length > 0) {
      const di = remaining.indexOf('$$'), ii = remaining.indexOf('$');
      if (di === -1 && ii === -1) { result += escapeHTML(remaining); break; }
      let isD = false, idx;
      if (di !== -1 && (ii === -1 || di <= ii)) {
        const ei = remaining.indexOf('$$', di + 2);
        if (ei !== -1) { isD = true; idx = di; } else { idx = ii; }
      } else { idx = ii; }
      if (idx === -1) { result += escapeHTML(remaining); break; }
      if (idx > 0) result += escapeHTML(remaining.substring(0, idx));
      if (isD) {
        const ei = remaining.indexOf('$$', idx + 2);
        try { result += katex.renderToString(remaining.substring(idx + 2, ei).trim(), { displayMode: true, throwOnError: false }); } catch(e) { result += '<code>?</code>'; }
        remaining = remaining.substring(ei + 2);
      } else {
        const ei = remaining.indexOf('$', idx + 1);
        if (ei === -1) { result += escapeHTML(remaining.substring(idx)); break; }
        const mc = remaining.substring(idx + 1, ei).trim();
        if (mc.length > 0) { try { result += katex.renderToString(mc, { displayMode: false, throwOnError: false }); } catch(e) { result += '<code>?</code>'; } }
        remaining = remaining.substring(ei + 1);
      }
    }
    return result.replace(new RegExp(ESC.replace(/\$/g, '\\$'), 'g'), '$');
  }

  function escapeHTML(str) { const d = document.createElement('div'); d.appendChild(document.createTextNode(str)); return d.innerHTML; }

  return { init, startTest, selectOption, submitAnswer, togglePause, downloadReport, getQuestionHistory };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  document.addEventListener('input', e => {
    if (e.target.id === 'numeric-answer') {
      const btn = document.getElementById('submit-btn');
      if (btn) btn.disabled = !e.target.value.trim();
    }
  });
});
