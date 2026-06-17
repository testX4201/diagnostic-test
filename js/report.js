/**
 * Encrypted Report Generator
 *
 * Uses Web Crypto API (PBKDF2 + AES-GCM) to encrypt the diagnostic report.
 * The report is encrypted with a tutor-chosen PIN and downloaded as a file.
 * Only someone with the PIN can decrypt it.
 *
 * Format: JSON → AES-GCM encrypt → Base64 → .enc file
 * Header includes salt + IV for decryption.
 */

const ReportGenerator = (() => {
  // ── Constants ──────────────────────────

  const ALGORITHM = 'AES-GCM';
  const KEY_LENGTH = 256;
  const PBKDF2_ITERATIONS = 100000;
  const SALT_LENGTH = 16;
  const IV_LENGTH = 12;

  // ── Encryption ─────────────────────────

  /**
   * Encrypt a report object with a PIN.
   * @param {Object} reportData - The full diagnostic report
   * @param {string} pin - The tutor's decryption PIN
   * @returns {Promise<Blob>} Encrypted .enc file blob
   */
  async function encryptReport(reportData, pin) {
    const json = JSON.stringify(reportData, null, 2);
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(json);

    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from PIN
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt']
    );

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      plaintext
    );

    // Package: [2-byte version][16-byte salt][12-byte IV][ciphertext]
    const version = new Uint8Array([0x01, 0x00]); // version 1.0
    const encrypted = new Uint8Array(
      version.length + salt.length + iv.length + ciphertext.byteLength
    );
    encrypted.set(version, 0);
    encrypted.set(salt, version.length);
    encrypted.set(iv, version.length + salt.length);
    encrypted.set(
      new Uint8Array(ciphertext),
      version.length + salt.length + iv.length
    );

    return new Blob([encrypted], { type: 'application/octet-stream' });
  }

  /**
   * Decrypt a report file with a PIN.
   * @param {ArrayBuffer} fileData - The encrypted file contents
   * @param {string} pin - The decryption PIN
   * @returns {Promise<Object>} The decrypted report data
   */
  async function decryptReport(fileData, pin) {
    const data = new Uint8Array(fileData);

    // Parse header: version(2) + salt(16) + IV(12)
    if (data.length < 30) throw new Error('Invalid file: too short');

    const version = data.slice(0, 2);
    if (version[0] !== 0x01) throw new Error('Unsupported file version');

    const salt = data.slice(2, 18);
    const iv = data.slice(18, 30);
    const ciphertext = data.slice(30);

    const encoder = new TextEncoder();

    // Derive key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['decrypt']
    );

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const json = decoder.decode(plaintext);
    return JSON.parse(json);
  }

  // ── Download ───────────────────────────

  /**
   * Trigger file download in the browser.
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate and download the encrypted report.
   */
  async function downloadEncryptedReport(pin) {
    // Gather all data
    const engineSummary = AdaptiveEngine.getSummary();
    const questionHistory = AdaptiveEngine.getState().questionHistory;

    // Map history to skill-report format
    const answeredQuestions = questionHistory.map((h, i) => ({
      questionId: h.id || `Q-${i}`,
      correct: h.correct,
      difficulty: h.difficulty,
      time: h.time,
    }));

    // Rebuild with actual question IDs from app
    if (typeof App !== 'undefined' && App.getQuestionHistory) {
      const appHistory = App.getQuestionHistory();
      if (appHistory && appHistory.length > 0) {
        for (let i = 0; i < Math.min(appHistory.length, answeredQuestions.length); i++) {
          answeredQuestions[i].questionId = appHistory[i].questionId || answeredQuestions[i].questionId;
        }
      }
    }

    const reportCard = SkillTaxonomy.generateReportCard(answeredQuestions);

    const report = {
      meta: {
        testName: 'NSW Y10 Mathematics Diagnostic Assessment',
        date: new Date().toISOString(),
        version: '1.0',
        totalQuestions: engineSummary.total,
        totalCorrect: engineSummary.correct,
        accuracy: engineSummary.accuracy,
        estimatedLevel: engineSummary.level,
        performanceBand: engineSummary.band,
        elapsedMinutes: engineSummary.elapsedMinutes,
        avgTimeSeconds: engineSummary.avgTimeSeconds,
      },
      skillReport: reportCard,
      questionLog: answeredQuestions.map((q, i) => ({
        index: i + 1,
        questionId: q.questionId,
        difficulty: q.difficulty,
        correct: q.correct,
        timeMs: q.time,
        skills: SkillTaxonomy.getSkillsForQuestion(q.questionId).map((s) => ({
          id: s.skillId,
          name: s.skillName,
          domain: s.domainName,
          topic: s.topicName,
        })),
      })),
    };

    try {
      const blob = await encryptReport(report, pin);
      const filename = `diagnostic-report-${Date.now()}.enc`;
      downloadBlob(blob, filename);
      return { success: true, filename };
    } catch (err) {
      console.error('Encryption failed:', err);
      return { success: false, error: err.message };
    }
  }

  // ── Decrypt UI Helper ──────────────────

  /**
   * Decrypt a file selected by the user.
   * @param {File} file - The .enc file from file input
   * @param {string} pin - The tutor's PIN
   * @returns {Promise<Object>}
   */
  async function decryptFile(file, pin) {
    const buffer = await file.arrayBuffer();
    return decryptReport(buffer, pin);
  }

  return {
    encryptReport,
    decryptReport,
    decryptFile,
    downloadEncryptedReport,
    downloadBlob,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReportGenerator;
}
