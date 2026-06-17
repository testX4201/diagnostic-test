/**
 * Skill Taxonomy & Question-Skill Mapping
 *
 * Models the full NSW Y10 syllabus as a hierarchical skill tree.
 * Each question maps to one or more skills. The system tracks
 * per-skill performance internally for the encrypted report.
 *
 * Architecture inspired by:
 *  - Renaissance Star Math: domain → skill progression
 *  - NWEA MAP Growth: RIT scale with learning statements
 *  - IRT (Item Response Theory): each item measures latent trait θ
 *
 * Scale is INTERNAL ONLY — never shown to the student.
 */

const SkillTaxonomy = (() => {
  // ── SKILL TREE ─────────────────────────
  // Hierarchical: Domain → Topic → Subtopic → Skill
  // Each node has: id, name, parent, difficulty (expected Y-level)

  const DOMAINS = [
    {
      id: 'ALG',
      name: 'Algebra',
      topics: [
        {
          id: 'ALG-PROD',
          name: 'Products and Factors',
          skills: [
            { id: 'ALG-PROD-DIST', name: 'Distributive Law', diff: 500 },
            { id: 'ALG-PROD-PSQR', name: 'Perfect Squares', diff: 600 },
            { id: 'ALG-PROD-PCUB', name: 'Perfect Cubes', diff: 700 },
          ],
        },
        {
          id: 'ALG-QUAD',
          name: 'Quadratic Equations',
          skills: [
            { id: 'ALG-QUAD-FACT', name: 'Factorisation', diff: 650 },
            { id: 'ALG-QUAD-CSQR', name: 'Completing the Square', diff: 800 },
            { id: 'ALG-QUAD-DISC', name: 'Discriminant', diff: 720 },
          ],
        },
        {
          id: 'ALG-FUR',
          name: 'Further Equations',
          skills: [
            { id: 'ALG-FUR-LIT', name: 'Literal Equations', diff: 750 },
            { id: 'ALG-FUR-SUB', name: 'Substitution', diff: 550 },
            { id: 'ALG-FUR-MSYS', name: 'Multivariate Systems', diff: 850 },
          ],
        },
      ],
    },
    {
      id: 'FUN',
      name: 'Functions',
      topics: [
        {
          id: 'FUN-QFUN',
          name: 'Quadratic Function',
          skills: [
            { id: 'FUN-QFUN-REL', name: 'Quadratic Relationships', diff: 650 },
            { id: 'FUN-QFUN-SKETCH', name: 'Sketching Parabolas', diff: 750 },
            { id: 'FUN-QFUN-FEAT', name: 'Features of Parabolas', diff: 850 },
          ],
        },
        {
          id: 'FUN-ROOTS',
          name: 'Roots of Quadratics',
          skills: [
            { id: 'FUN-ROOTS-BEH', name: 'Behaviour of Roots', diff: 800 },
            { id: 'FUN-ROOTS-COEF', name: 'Roots and Coefficients', diff: 900 },
            { id: 'FUN-ROOTS-APP', name: 'Applications of Roots', diff: 950 },
          ],
        },
        {
          id: 'FUN-EXP',
          name: 'Exponential Function',
          skills: [
            { id: 'FUN-EXP-REL', name: 'Exponential Relationships', diff: 800 },
            { id: 'FUN-EXP-EQN', name: 'Exp. Equations/Inequations', diff: 900 },
            { id: 'FUN-EXP-GROW', name: 'Growth and Decay', diff: 950 },
          ],
        },
        {
          id: 'FUN-LOG',
          name: 'Logarithmic Function',
          skills: [
            { id: 'FUN-LOG-DEF', name: 'Definition and Conventions', diff: 850 },
            { id: 'FUN-LOG-EVAL', name: 'Evaluating Logarithms', diff: 880 },
            { id: 'FUN-LOG-EQN', name: 'Logarithmic Equations', diff: 950 },
            { id: 'FUN-LOG-LAWS', name: 'Laws of Logarithms', diff: 920 },
            { id: 'FUN-LOG-REL', name: 'Logarithmic Relationships', diff: 980 },
          ],
        },
      ],
    },
    {
      id: 'GEO',
      name: 'Geometry',
      topics: [
        {
          id: 'GEO-COORD',
          name: 'Coordinate Geometry',
          skills: [
            { id: 'GEO-COORD-LOCI', name: 'Loci and Regions', diff: 700 },
            { id: 'GEO-COORD-GQUAD', name: 'Geometry of Quadratics', diff: 850 },
            { id: 'GEO-COORD-OPT', name: 'Quadratic Optimisation', diff: 950 },
          ],
        },
        {
          id: 'GEO-CIRC',
          name: 'Circles and Semicircles',
          skills: [
            { id: 'GEO-CIRC-SKETCH', name: 'Sketching Circles', diff: 800 },
            { id: 'GEO-CIRC-SEMI', name: 'Sketching Semicircles', diff: 850 },
            { id: 'GEO-CIRC-FUR', name: 'Further Coordinate Geometry', diff: 900 },
          ],
        },
        {
          id: 'GEO-CONG',
          name: 'Congruence and Similarity',
          skills: [
            { id: 'GEO-CONG-TRANS', name: 'Planar Transformation', diff: 700 },
            { id: 'GEO-CONG-CTRI', name: 'Congruent Triangles', diff: 750 },
            { id: 'GEO-CONG-STRI', name: 'Similar Triangles', diff: 800 },
          ],
        },
        {
          id: 'GEO-CIRCLE',
          name: 'Circle Geometry',
          skills: [
            { id: 'GEO-CIRCLE-COMP', name: 'Components of a Circle', diff: 700 },
            { id: 'GEO-CIRCLE-ANG', name: 'Properties of Angles', diff: 850 },
            { id: 'GEO-CIRCLE-CYCL', name: 'Cyclic Quadrilaterals', diff: 950 },
            { id: 'GEO-CIRCLE-TANG', name: 'Properties of Tangents', diff: 1000 },
          ],
        },
        {
          id: 'GEO-FPG',
          name: 'Further Plane Geometry',
          skills: [
            { id: 'GEO-FPG-LEN', name: 'Lengths', diff: 700 },
            { id: 'GEO-FPG-QUAD', name: 'Quadrilateral Properties', diff: 750 },
            { id: 'GEO-FPG-POLY', name: 'Polygons', diff: 800 },
          ],
        },
      ],
    },
    {
      id: 'TRIG',
      name: 'Trigonometry',
      topics: [
        {
          id: 'TRIG-CIRC',
          name: 'Circular Trigonometry',
          skills: [
            { id: 'TRIG-CIRC-FUNC', name: 'Circular Functions', diff: 850 },
            { id: 'TRIG-CIRC-ID', name: 'Trigonometric Identities', diff: 900 },
            { id: 'TRIG-CIRC-REL', name: 'Related Ratios', diff: 950 },
          ],
        },
        {
          id: 'TRIG-FORM',
          name: 'Trigonometric Formulae',
          skills: [
            { id: 'TRIG-FORM-INCL', name: 'Angle of Inclination', diff: 750 },
            { id: 'TRIG-FORM-AREA', name: 'Area Formulae', diff: 800 },
            { id: 'TRIG-FORM-SOLVE', name: 'Solving Triangles', diff: 900 },
          ],
        },
      ],
    },
    {
      id: 'STAT',
      name: 'Statistics and Probability',
      topics: [
        {
          id: 'STAT-UNI',
          name: 'Univariate Data Analysis',
          skills: [
            { id: 'STAT-UNI-QUART', name: 'Quartiles/Percentiles', diff: 650 },
            { id: 'STAT-UNI-SPREAD', name: 'Measures of Spread', diff: 700 },
            { id: 'STAT-UNI-SKEW', name: 'Dispersion/Skewness', diff: 750 },
          ],
        },
        {
          id: 'STAT-BIV',
          name: 'Bivariate Data Analysis',
          skills: [
            { id: 'STAT-BIV-DEF', name: 'IV/DV Definitions', diff: 650 },
            { id: 'STAT-BIV-CORR', name: 'Correlation Analysis', diff: 750 },
            { id: 'STAT-BIV-REG', name: 'Regression Analysis', diff: 850 },
          ],
        },
        {
          id: 'STAT-REP',
          name: 'Representations of Data',
          skills: [
            { id: 'STAT-REP-BOX', name: 'Box Plots', diff: 700 },
            { id: 'STAT-REP-SCAT', name: 'Scatter Plots', diff: 750 },
            { id: 'STAT-REP-EXTR', name: 'Extrapolation/Interpolation', diff: 800 },
          ],
        },
        {
          id: 'STAT-PROB',
          name: 'Probability',
          skills: [
            { id: 'STAT-PROB-BASIC', name: 'Probability Basics', diff: 650 },
            { id: 'STAT-PROB-EVENT', name: 'Relationship Between Events', diff: 700 },
            { id: 'STAT-PROB-COND', name: 'Conditional Probability', diff: 850 },
            { id: 'STAT-PROB-VENN', name: 'Venn Diagrams', diff: 800 },
            { id: 'STAT-PROB-IND', name: 'Independence/Dependence', diff: 900 },
          ],
        },
      ],
    },
    {
      id: 'NUM',
      name: 'Number and Finance',
      topics: [
        {
          id: 'NUM-CONS',
          name: 'Consumer Arithmetic',
          skills: [
            { id: 'NUM-CONS-WAGE', name: 'Wages and Salaries', diff: 500 },
            { id: 'NUM-CONS-TAX', name: 'Tax/Levies', diff: 550 },
            { id: 'NUM-CONS-DISC', name: 'Discounts', diff: 550 },
            { id: 'NUM-CONS-PROFIT', name: 'Profit and Loss', diff: 600 },
            { id: 'NUM-CONS-COMM', name: 'Commission', diff: 650 },
            { id: 'NUM-CONS-SIMP', name: 'Simple Interest', diff: 650 },
            { id: 'NUM-CONS-COMP', name: 'Compound Interest', diff: 800 },
            { id: 'NUM-CONS-DEPR', name: 'Depreciation', diff: 850 },
            { id: 'NUM-CONS-LOAN', name: 'Loans and Repayments', diff: 900 },
            { id: 'NUM-CONS-ANN', name: 'Annuities/Loans', diff: 950 },
          ],
        },
        {
          id: 'NUM-PROP',
          name: 'Proportionality and Rates',
          skills: [
            { id: 'NUM-PROP-DIR', name: 'Direct Variation', diff: 600 },
            { id: 'NUM-PROP-INV', name: 'Inverse Variation', diff: 700 },
            { id: 'NUM-PROP-PHYS', name: 'Physical Phenomena', diff: 750 },
          ],
        },
        {
          id: 'NUM-RECIP',
          name: 'Reciprocal Function',
          skills: [
            { id: 'NUM-RECIP-SKETCH', name: 'Sketching Hyperbolas', diff: 800 },
            { id: 'NUM-RECIP-ASYMP', name: 'Asymptotes', diff: 850 },
          ],
        },
      ],
    },
    {
      id: 'FOUND',
      name: 'Assumed Knowledge',
      topics: [
        {
          id: 'FOUND-ARITH',
          name: 'Arithmetic',
          skills: [
            { id: 'FOUND-ARITH-OPS', name: 'Four Operations', diff: 200 },
            { id: 'FOUND-ARITH-FRAC', name: 'Fractions', diff: 350 },
            { id: 'FOUND-ARITH-DEC', name: 'Decimals', diff: 300 },
            { id: 'FOUND-ARITH-NEG', name: 'Negative Numbers', diff: 350 },
            { id: 'FOUND-ARITH-ORDER', name: 'Order of Operations', diff: 400 },
          ],
        },
        {
          id: 'FOUND-ALG',
          name: 'Basic Algebra',
          skills: [
            { id: 'FOUND-ALG-EXPR', name: 'Algebraic Expressions', diff: 400 },
            { id: 'FOUND-ALG-SOLVE', name: 'Solving Linear Equations', diff: 450 },
            { id: 'FOUND-ALG-IND', name: 'Indices/Exponents', diff: 500 },
          ],
        },
        {
          id: 'FOUND-GEOM',
          name: 'Basic Geometry',
          skills: [
            { id: 'FOUND-GEOM-AREA', name: 'Area and Perimeter', diff: 350 },
            { id: 'FOUND-GEOM-VOL', name: 'Volume', diff: 400 },
            { id: 'FOUND-GEOM-ANG', name: 'Angles', diff: 400 },
          ],
        },
      ],
    },
  ];

  // ── FLAT SKILL INDEX ──────────────────

  // Build a flat map: skillId → {skill info + domain/topic parents}
  const skillIndex = {};
  const domainIndex = {};
  const topicIndex = {};

  (function buildIndex() {
    for (const domain of DOMAINS) {
      domainIndex[domain.id] = domain;
      for (const topic of domain.topics) {
        topicIndex[topic.id] = topic;
        for (const skill of topic.skills) {
          skillIndex[skill.id] = {
            ...skill,
            domainId: domain.id,
            domainName: domain.name,
            topicId: topic.id,
            topicName: topic.name,
          };
        }
      }
    }
  })();

  // ── QUESTION → SKILL MAPPING ──────────

  /**
   * Each question ID maps to one or more skill IDs.
   * A question can test multiple skills (e.g., algebra + arithmetic).
   * The first skill in the array is the PRIMARY skill.
   */
  const questionSkillMap = {
    // POC
    'POC-001': ['FOUND-ARITH-OPS', 'FOUND-ARITH-ORDER'],
    'POC-002': ['ALG-PROD-DIST', 'FOUND-ALG-EXPR'],
    'POC-003': ['ALG-QUAD-DISC', 'FOUND-ALG-SOLVE'],
    'POC-004': ['FUN-QFUN-FEAT', 'FUN-QFUN-REL'],
    'POC-005': ['NUM-CONS-COMP', 'FOUND-ARITH-OPS'],
    'TIKZ-001': ['GEO-CONG-CTRI', 'FOUND-GEOM-ANG'],
    'TIKZ-002': ['GEO-CIRC-SKETCH', 'GEO-COORD-LOCI'],
    // Foundational
    'F-001': ['FOUND-ARITH-OPS'], 'F-002': ['FOUND-ARITH-OPS'],
    'F-003': ['FOUND-ARITH-OPS'], 'F-004': ['FOUND-ARITH-OPS'],
    'F-005': ['FOUND-ARITH-ORDER'], 'F-006': ['FOUND-ARITH-ORDER'],
    'F-007': ['FOUND-ARITH-FRAC'], 'F-008': ['FOUND-ARITH-FRAC'],
    'F-009': ['FOUND-ARITH-DEC'], 'F-010': ['FOUND-ARITH-NEG'],
    'F-011': ['FOUND-ALG-IND'], 'F-012': ['FOUND-ALG-SOLVE'],
    'F-013': ['FOUND-ALG-SOLVE'], 'F-014': ['FOUND-ALG-EXPR'],
    'F-015': ['FOUND-ARITH-OPS'],
    // Products and Factors
    'PF-001': ['ALG-PROD-DIST'], 'PF-002': ['ALG-PROD-DIST'],
    'PF-003': ['ALG-PROD-DIST'], 'PF-004': ['ALG-PROD-DIST'],
    'PF-005': ['ALG-PROD-PSQR'], 'PF-006': ['ALG-PROD-PSQR'],
    'PF-007': ['ALG-PROD-DIST'], 'PF-008': ['ALG-PROD-PSQR'],
    'PF-009': ['ALG-PROD-PSQR'], 'PF-010': ['ALG-PROD-PCUB'],
    'PF-011': ['ALG-PROD-DIST'], 'PF-012': ['ALG-PROD-PCUB'],
    'PF-013': ['ALG-PROD-PCUB'], 'PF-014': ['ALG-PROD-PSQR'],
    'PF-015': ['ALG-PROD-DIST'], 'PF-016': ['ALG-PROD-PSQR'],
    'PF-017': ['ALG-PROD-PCUB'], 'PF-018': ['ALG-PROD-DIST'],
    'PF-019': ['ALG-PROD-PSQR', 'FUN-QFUN-FEAT'],
    'PF-020': ['ALG-PROD-PCUB'],
    // Quadratic Equations
    'QE-001': ['ALG-QUAD-FACT'], 'QE-002': ['ALG-QUAD-FACT'],
    'QE-003': ['ALG-QUAD-FACT'], 'QE-004': ['ALG-QUAD-FACT'],
    'QE-005': ['ALG-QUAD-DISC'], 'QE-006': ['ALG-QUAD-FACT'],
    'QE-007': ['ALG-QUAD-DISC'], 'QE-008': ['ALG-QUAD-CSQR'],
    'QE-009': ['ALG-QUAD-CSQR'], 'QE-010': ['ALG-QUAD-CSQR'],
    'QE-011': ['ALG-QUAD-DISC'], 'QE-012': ['ALG-QUAD-FACT'],
    // Further Equations
    'FE-001': ['ALG-FUR-SUB'], 'FE-002': ['ALG-FUR-SUB'],
    'FE-003': ['ALG-FUR-LIT'], 'FE-004': ['ALG-FUR-LIT'],
    'FE-005': ['ALG-FUR-SUB', 'ALG-FUR-MSYS'],
    'FE-006': ['ALG-FUR-MSYS'], 'FE-007': ['ALG-FUR-MSYS'],
    'FE-008': ['ALG-FUR-MSYS'], 'FE-009': ['ALG-FUR-LIT'],
    'FE-010': ['ALG-FUR-MSYS'], 'FE-011': ['ALG-FUR-SUB'],
    'FE-012': ['ALG-FUR-MSYS'], 'FE-013': ['ALG-FUR-LIT'],
    // Quadratic Function
    'QF-001': ['FUN-QFUN-REL'], 'QF-002': ['FUN-QFUN-REL'],
    'QF-003': ['FUN-QFUN-FEAT'], 'QF-004': ['FUN-QFUN-FEAT'],
    'QF-005': ['FUN-QFUN-SKETCH'], 'QF-006': ['FUN-QFUN-FEAT'],
    'QF-007': ['FUN-QFUN-SKETCH'], 'QF-008': ['FUN-QFUN-REL'],
    'QF-009': ['FUN-QFUN-FEAT'], 'QF-010': ['FUN-QFUN-SKETCH'],
    'QF-011': ['FUN-ROOTS-COEF'], 'QF-012': ['FUN-ROOTS-COEF'],
    // AMC-level
    'AMC-001': ['ALG-QUAD-FACT', 'FUN-ROOTS-COEF'],
    'AMC-002': ['ALG-PROD-PSQR', 'FOUND-ALG-IND'],
    'AMC-003': ['ALG-FUR-MSYS'],
    'AMC-004': ['ALG-PROD-PSQR', 'FOUND-ARITH-OPS'],
    'AMC-005': ['ALG-FUR-MSYS', 'STAT-UNI-QUART'],
    'AMC-006': ['ALG-QUAD-DISC'],
    'AMC-007': ['ALG-PROD-DIST', 'FOUND-ALG-IND'],
    'AMC-008': ['ALG-FUR-LIT'],
    'AMC-009': ['FUN-EXP-REL', 'FOUND-ALG-IND'],

    // Circles and Semicircles
    'CS-001': ['GEO-CIRC-SKETCH'],
    'CS-002': ['GEO-CIRC-SKETCH'],
    'CS-003': ['GEO-CIRC-SEMI'],
    'CS-004': ['GEO-CIRC-SEMI'],
    'CS-005': ['GEO-CIRC-FUR', 'GEO-COORD-LOCI'],
    'CS-006': ['GEO-CIRC-SKETCH', 'GEO-COORD-LOCI'],
    'CS-007': ['GEO-CIRC-FUR', 'GEO-CIRCLE-TANG'],
    'CS-008': ['GEO-CIRC-SKETCH', 'GEO-COORD-LOCI'],
    'CS-009': ['GEO-CIRC-FUR'],
    'CS-010': ['GEO-CIRC-SEMI'],
    'CS-011': ['GEO-CIRC-FUR', 'GEO-COORD-LOCI'],
    'CS-012': ['GEO-CIRC-SKETCH', 'GEO-FPG-QUAD'],

    // Congruence and Similarity
    'CSM-001': ['GEO-CONG-CTRI'],
    'CSM-002': ['GEO-CONG-STRI'],
    'CSM-003': ['GEO-CONG-STRI'],
    'CSM-004': ['GEO-CONG-CTRI'],
    'CSM-005': ['GEO-CONG-STRI'],
    'CSM-006': ['GEO-CONG-TRANS', 'GEO-COORD-LOCI'],
    'CSM-007': ['GEO-CONG-STRI'],
    'CSM-008': ['GEO-CONG-TRANS'],
    'CSM-009': ['GEO-CONG-CTRI', 'GEO-COORD-LOCI'],
    'CSM-010': ['GEO-CONG-STRI', 'GEO-CIRCLE-CYCL'],

    // Further Plane Geometry
    'FPG-001': ['GEO-FPG-LEN'],
    'FPG-002': ['GEO-FPG-QUAD'],
    'FPG-003': ['GEO-FPG-POLY'],
    'FPG-004': ['GEO-FPG-LEN', 'GEO-FPG-QUAD'],
    'FPG-005': ['GEO-FPG-QUAD'],
    'FPG-006': ['GEO-FPG-POLY'],
    'FPG-007': ['GEO-FPG-LEN'],
    'FPG-008': ['GEO-FPG-QUAD'],

    // Circle Geometry
    'CIR-001': ['GEO-CIRCLE-COMP', 'GEO-CIRCLE-ANG'],
    'CIR-002': ['GEO-CIRCLE-ANG'],
    'CIR-003': ['GEO-CIRCLE-COMP'],
    'CIR-004': ['GEO-CIRCLE-CYCL'],
    'CIR-005': ['GEO-CIRCLE-ANG'],
    'CIR-006': ['GEO-CIRCLE-CYCL'],
    'CIR-007': ['GEO-CIRCLE-COMP', 'GEO-CIRCLE-TANG'],
    'CIR-008': ['GEO-CIRCLE-TANG', 'GEO-CIRCLE-ANG'],
    'CIR-009': ['GEO-CIRCLE-CYCL'],

    // Trigonometry
    'TRG-001': ['TRIG-CIRC-FUNC'],
    'TRG-002': ['TRIG-CIRC-FUNC'],
    'TRG-003': ['TRIG-CIRC-FUNC'],
    'TRG-004': ['TRIG-CIRC-FUNC'],
    'TRG-005': ['TRIG-CIRC-FUNC'],
    'TRG-006': ['TRIG-CIRC-ID'],
    'TRG-007': ['TRIG-CIRC-ID', 'TRIG-CIRC-REL'],
    'TRG-008': ['TRIG-FORM-INCL'],
    'TRG-009': ['TRIG-FORM-AREA'],
    'TRG-010': ['TRIG-FORM-SOLVE'],
    'TRG-011': ['TRIG-CIRC-REL'],
    'TRG-012': ['TRIG-FORM-AREA'],
    'TRG-013': ['TRIG-CIRC-ID'],
    'TRG-014': ['TRIG-FORM-SOLVE'],

    // Exponential Function
    'EXP-001': ['FUN-EXP-REL'],
    'EXP-002': ['FUN-EXP-REL'],
    'EXP-003': ['FUN-EXP-REL'],
    'EXP-004': ['FUN-EXP-REL'],
    'EXP-005': ['FUN-EXP-REL'],
    'EXP-006': ['FUN-EXP-REL'],
    'EXP-007': ['FUN-EXP-GROW'],
    'EXP-008': ['FUN-EXP-EQN'],
    'EXP-009': ['FUN-EXP-GROW'],
    'EXP-010': ['FUN-EXP-EQN'],

    // Logarithmic Function
    'LOG-001': ['FUN-LOG-DEF'],
    'LOG-002': ['FUN-LOG-EVAL'],
    'LOG-003': ['FUN-LOG-EVAL'],
    'LOG-004': ['FUN-LOG-LAWS'],
    'LOG-005': ['FUN-LOG-LAWS'],
    'LOG-006': ['FUN-LOG-LAWS'],
    'LOG-007': ['FUN-LOG-EVAL'],
    'LOG-008': ['FUN-LOG-EQN'],
    'LOG-009': ['FUN-LOG-EQN'],
    'LOG-010': ['FUN-LOG-LAWS'],

    // Statistics and Probability
    'STP-001': ['STAT-UNI-SPREAD'],
    'STP-002': ['STAT-UNI-QUART'],
    'STP-003': ['STAT-UNI-SPREAD'],
    'STP-004': ['STAT-UNI-QUART'],
    'STP-005': ['STAT-PROB-BASIC'],
    'STP-006': ['STAT-PROB-BASIC'],
    'STP-007': ['STAT-PROB-BASIC'],
    'STP-008': ['STAT-UNI-QUART', 'STAT-REP-BOX'],
    'STP-009': ['STAT-PROB-BASIC'],
    'STP-010': ['STAT-PROB-BASIC'],
    'STP-011': ['STAT-BIV-CORR', 'STAT-REP-SCAT'],
    'STP-012': ['STAT-UNI-QUART'],
    'STP-013': ['STAT-PROB-BASIC'],
    'STP-014': ['STAT-PROB-BASIC'],


    // Coordinate Geometry
    'CG-001': ['GEO-COORD-LOCI'],
    'CG-002': ['GEO-COORD-LOCI'],
    'CG-003': ['GEO-COORD-LOCI'],
    'CG-004': ['GEO-COORD-LOCI'],
    'CG-005': ['GEO-COORD-LOCI'],
    'CG-006': ['GEO-COORD-LOCI'],
    'CG-007': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-008': ['GEO-COORD-LOCI'],
    'CG-009': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-010': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-011': ['GEO-COORD-LOCI'],
    'CG-012': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-013': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-014': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-015': ['GEO-COORD-LOCI'],
    'CG-016': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],

    // Proportionality and Rates
    'PR-001': ['NUM-PROP-DIR'],
    'PR-002': ['NUM-PROP-DIR'],
    'PR-003': ['NUM-PROP-INV'],
    'PR-004': ['NUM-PROP-INV'],
    'PR-005': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-006': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-007': ['NUM-PROP-DIR'],
    'PR-008': ['NUM-PROP-INV'],
    'PR-009': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-010': ['NUM-PROP-DIR'],
    'PR-011': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-012': ['NUM-PROP-INV'],
    'PR-013': ['NUM-PROP-DIR'],
    'PR-014': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],

    // Reciprocal Function
    'RF-001': ['NUM-RECIP-SKETCH'],
    'RF-002': ['NUM-RECIP-ASYMP'],
    'RF-003': ['NUM-RECIP-ASYMP'],
    'RF-004': ['NUM-RECIP-SKETCH'],
    'RF-005': ['NUM-RECIP-SKETCH'],
    'RF-006': ['NUM-RECIP-ASYMP'],
    'RF-007': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],
    'RF-008': ['NUM-RECIP-SKETCH'],
    'RF-009': ['NUM-RECIP-ASYMP'],
    'RF-010': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],
    'RF-011': ['NUM-RECIP-SKETCH'],
    'RF-012': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],

    // Roots of Quadratics
    'RQ-001': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-002': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-003': ['FUN-ROOTS-COEF'],
    'RQ-004': ['FUN-ROOTS-COEF'],
    'RQ-005': ['FUN-ROOTS-COEF'],
    'RQ-006': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-007': ['FUN-ROOTS-COEF'],
    'RQ-008': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-009': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-010': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-011': ['FUN-ROOTS-COEF'],
    'RQ-012': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-013': ['FUN-ROOTS-COEF'],
    'RQ-014': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-015': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-016': ['FUN-ROOTS-COEF'],
    'RQ-017': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],


    // Consumer Arithmetic & Financial Mathematics
    'FIN-001': ['NUM-CONS-WAGE'],
    'FIN-002': ['NUM-CONS-WAGE'],
    'FIN-003': ['NUM-CONS-TAX'],
    'FIN-004': ['NUM-CONS-DISC'],
    'FIN-005': ['NUM-CONS-PROFIT'],
    'FIN-006': ['NUM-CONS-COMM'],
    'FIN-007': ['NUM-CONS-SIMP'],
    'FIN-008': ['NUM-CONS-SIMP'],
    'FIN-009': ['NUM-CONS-COMP'],
    'FIN-010': ['NUM-CONS-COMP'],
    'FIN-011': ['NUM-CONS-DEPR'],
    'FIN-012': ['NUM-CONS-DEPR'],
    'FIN-013': ['NUM-CONS-LOAN'],
    'FIN-014': ['NUM-CONS-COMP'],

    // Advanced Problem Solving
    'ADV-001': ['FOUND-ALG-EXPR', 'ALG-PROD-DIST'],
    'ADV-002': ['FOUND-ALG-EXPR', 'ALG-PROD-DIST'],
    'ADV-003': ['ALG-FUR-SUB', 'ALG-FUR-MSYS'],
    'ADV-004': ['ALG-FUR-SUB'],
    'ADV-005': ['ALG-FUR-SUB', 'ALG-FUR-MSYS'],
    'ADV-006': ['FOUND-ARITH-OPS'],
    'ADV-007': ['STAT-PROB-BASIC'],
    'ADV-008': ['STAT-PROB-BASIC'],
    'ADV-009': ['ALG-FUR-SUB', 'NUM-PROP-INV'],
    'ADV-010': ['ALG-FUR-MSYS'],


    // Linear Relationships
    'LIN-001': ['FOUND-ALG-EXPR'],
    'LIN-002': ['FOUND-ALG-EXPR'],
    'LIN-003': ['FOUND-ALG-EXPR'],
    'LIN-004': ['FOUND-ALG-EXPR', 'GEO-COORD-LOCI'],
    'LIN-005': ['ALG-FUR-MSYS'],
    'LIN-006': ['ALG-FUR-MSYS'],
    'LIN-007': ['ALG-FUR-SUB'],
    'LIN-008': ['ALG-FUR-MSYS'],
    'LIN-009': ['ALG-FUR-SUB'],
    'LIN-010': ['GEO-COORD-LOCI'],
    'LIN-011': ['ALG-FUR-MSYS'],
    'LIN-012': ['GEO-COORD-LOCI', 'FOUND-GEOM-AREA'],

    // Measurement
    'MEA-001': ['FOUND-GEOM-AREA'],
    'MEA-002': ['FOUND-GEOM-AREA'],
    'MEA-003': ['FOUND-GEOM-AREA'],
    'MEA-004': ['FOUND-GEOM-VOL'],
    'MEA-005': ['FOUND-GEOM-VOL'],
    'MEA-006': ['FOUND-GEOM-ANG'],
    'MEA-007': ['FOUND-GEOM-VOL'],
    'MEA-008': ['FOUND-GEOM-VOL'],
    'MEA-009': ['FOUND-GEOM-ANG', 'FOUND-GEOM-VOL'],
    'MEA-010': ['FOUND-GEOM-VOL'],

    // Polynomials
    'POL-001': ['ALG-PROD-DIST'],
    'POL-002': ['ALG-PROD-DIST'],
    'POL-003': ['ALG-PROD-DIST'],
    'POL-004': ['FUN-QFUN-REL'],
    'POL-005': ['ALG-PROD-DIST', 'FUN-ROOTS-COEF'],
    'POL-006': ['ALG-PROD-DIST', 'FUN-ROOTS-COEF'],
    'POL-007': ['ALG-PROD-DIST', 'FUN-ROOTS-COEF'],
    'POL-008': ['ALG-PROD-DIST', 'FUN-ROOTS-COEF'],
    'POL-009': ['ALG-FUR-MSYS', 'FUN-ROOTS-COEF'],
    'POL-010': ['FUN-ROOTS-COEF', 'FUN-ROOTS-BEH'],

    // Algebraic Fractions
    'ALF-001': ['ALG-PROD-DIST'],
    'ALF-002': ['ALG-PROD-DIST', 'ALG-QUAD-FACT'],
    'ALF-003': ['FOUND-ARITH-FRAC'],
    'ALF-004': ['FOUND-ARITH-FRAC', 'ALG-PROD-DIST'],
    'ALF-005': ['ALG-FUR-LIT'],
    'ALF-006': ['ALG-FUR-LIT'],
    'ALF-007': ['ALG-FUR-LIT'],
    'ALF-008': ['ALG-FUR-LIT'],


    // Sequences and Series
    'SEQ-001': ['FOUND-ALG-EXPR'],
    'SEQ-002': ['FOUND-ALG-EXPR'],
    'SEQ-003': ['FOUND-ALG-EXPR'],
    'SEQ-004': ['FOUND-ALG-EXPR', 'ALG-PROD-DIST'],
    'SEQ-005': ['FOUND-ALG-IND'],
    'SEQ-006': ['FOUND-ALG-IND'],
    'SEQ-007': ['FOUND-ALG-IND', 'ALG-PROD-DIST'],
    'SEQ-008': ['FOUND-ALG-EXPR'],
    'SEQ-009': ['FOUND-ALG-EXPR'],
    'SEQ-010': ['FUN-EXP-GROW', 'FOUND-ALG-EXPR'],

    // Data Analysis
    'DAT-001': ['STAT-UNI-SPREAD'],
    'DAT-002': ['STAT-UNI-QUART'],
    'DAT-003': ['STAT-UNI-QUART', 'STAT-REP-BOX'],
    'DAT-004': ['STAT-BIV-CORR', 'STAT-REP-SCAT'],
    'DAT-005': ['STAT-BIV-REG', 'STAT-REP-SCAT'],
    'DAT-006': ['STAT-UNI-SPREAD'],
    'DAT-007': ['STAT-REP-EXTR'],
    'DAT-008': ['STAT-UNI-QUART'],
    'DAT-009': ['STAT-UNI-SPREAD', 'STAT-UNI-SKEW'],
    'DAT-010': ['STAT-REP-EXTR'],

    // Inequalities
    'INE-001': ['ALG-FUR-SUB'],
    'INE-002': ['ALG-FUR-SUB'],
    'INE-003': ['ALG-FUR-SUB'],
    'INE-004': ['GEO-COORD-LOCI'],
    'INE-005': ['ALG-QUAD-DISC', 'FUN-ROOTS-BEH'],
    'INE-006': ['ALG-QUAD-DISC', 'FUN-ROOTS-BEH'],
    'INE-007': ['ALG-FUR-SUB'],
    'INE-008': ['ALG-FUR-SUB'],
    'INE-009': ['GEO-COORD-LOCI', 'ALG-FUR-MSYS'],
    'INE-010': ['ALG-QUAD-DISC', 'FUN-ROOTS-BEH'],

    // Probability
    'PRB-001': ['STAT-PROB-BASIC'],
    'PRB-002': ['STAT-PROB-BASIC'],
    'PRB-003': ['STAT-PROB-COND'],
    'PRB-004': ['STAT-PROB-COND'],
    'PRB-005': ['STAT-PROB-BASIC'],
    'PRB-006': ['STAT-PROB-VENN'],
    'PRB-007': ['STAT-PROB-IND'],
    'PRB-008': ['STAT-PROB-BASIC'],
    'PRB-009': ['STAT-PROB-COND'],
    'PRB-010': ['STAT-PROB-BASIC'],


    // Functions and Relations
    'FNC-001': ['FUN-QFUN-REL'],
    'FNC-002': ['FUN-QFUN-REL'],
    'FNC-003': ['FUN-QFUN-REL'],
    'FNC-004': ['FUN-QFUN-FEAT'],
    'FNC-005': ['FUN-QFUN-REL'],
    'FNC-006': ['FUN-QFUN-REL'],
    'FNC-007': ['FUN-QFUN-REL'],
    'FNC-008': ['FUN-QFUN-REL'],

    // Curve Sketching
    'CRV-001': ['FUN-QFUN-SKETCH'],
    'CRV-002': ['FUN-QFUN-SKETCH'],
    'CRV-003': ['FUN-QFUN-SKETCH'],
    'CRV-004': ['FUN-QFUN-SKETCH'],
    'CRV-005': ['FUN-QFUN-SKETCH'],
    'CRV-006': ['FUN-QFUN-SKETCH'],
    'CRV-007': ['NUM-RECIP-SKETCH'],
    'CRV-008': ['FUN-QFUN-SKETCH'],

    // Non-Linear Modelling
    'NLM-001': ['FUN-QFUN-FEAT'],
    'NLM-002': ['GEO-COORD-OPT'],
    'NLM-003': ['FUN-EXP-GROW'],
    'NLM-004': ['FUN-EXP-GROW'],
    'NLM-005': ['GEO-COORD-OPT'],
    'NLM-006': ['NUM-PROP-INV'],
    'NLM-007': ['FUN-EXP-GROW', 'FUN-LOG-EQN'],
    'NLM-008': ['ALG-QUAD-DISC', 'FUN-ROOTS-BEH'],

    // Ratio, Rates and Time
    'RRT-001': ['FOUND-ARITH-FRAC'],
    'RRT-002': ['FOUND-ARITH-FRAC'],
    'RRT-003': ['NUM-PROP-DIR'],
    'RRT-004': ['NUM-PROP-DIR'],
    'RRT-005': ['NUM-PROP-DIR'],
    'RRT-006': ['FOUND-ARITH-OPS'],
    'RRT-007': ['NUM-PROP-DIR'],
    'RRT-008': ['NUM-PROP-DIR', 'ALG-FUR-SUB'],
  };

  // ── PUBLIC API ────────────────────────

  function getSkillInfo(skillId) {
    return skillIndex[skillId] || null;
  }

  function getSkillsForQuestion(questionId) {
    const skillIds = questionSkillMap[questionId] || [];
    return skillIds.map((id) => skillIndex[id]).filter(Boolean);
  }

  function getPrimarySkill(questionId) {
    const skillIds = questionSkillMap[questionId] || [];
    if (skillIds.length === 0) return null;
    return skillIndex[skillIds[0]] || null;
  }

  function getAllSkillIds() {
    return Object.keys(skillIndex);
  }

  function getDomains() {
    return DOMAINS;
  }

  function getDomainById(id) {
    return domainIndex[id] || null;
  }

  function getTopicById(id) {
    return topicIndex[id] || null;
  }

  /**
   * Generate a structured report card from answered questions.
   * @param {Array} answeredQuestions - [{questionId, correct, difficulty, time}]
   * @returns {Object} Structured report with domain/topic/skill breakdowns
   */
  function generateReportCard(answeredQuestions) {
    // Initialize accumulators per skill
    const skillStats = {};
    for (const skillId of Object.keys(skillIndex)) {
      skillStats[skillId] = {
        skillId,
        skillName: skillIndex[skillId].name,
        attempts: 0,
        correct: 0,
        totalTime: 0,
        difficulties: [],
      };
    }

    // Aggregate
    for (const answer of answeredQuestions) {
      const skillIds = questionSkillMap[answer.questionId] || [];
      for (const skillId of skillIds) {
        if (!skillStats[skillId]) continue;
        skillStats[skillId].attempts++;
        if (answer.correct) skillStats[skillId].correct++;
        skillStats[skillId].totalTime += answer.time || 0;
        skillStats[skillId].difficulties.push(answer.difficulty || 500);
      }
    }

    // Build domain-level summaries
    const domainSummaries = DOMAINS.map((domain) => {
      const topicSummaries = domain.topics.map((topic) => {
        const skillSummaries = topic.skills.map((skill) => {
          const stats = skillStats[skill.id];
          const accuracy = stats && stats.attempts > 0
            ? Math.round((stats.correct / stats.attempts) * 100)
            : null; // null = not tested
          const avgDifficulty = stats && stats.difficulties.length > 0
            ? Math.round(stats.difficulties.reduce((a, b) => a + b, 0) / stats.difficulties.length)
            : null;

          return {
            skillId: skill.id,
            skillName: skill.name,
            expectedDifficulty: skill.diff,
            attempts: stats ? stats.attempts : 0,
            correct: stats ? stats.correct : 0,
            accuracy,
            avgDifficultyTested: avgDifficulty,
            proficiency: accuracy !== null
              ? accuracy >= 80 ? 'Strong'
                : accuracy >= 60 ? 'Developing'
                : accuracy >= 40 ? 'Emerging'
                : 'Needs Attention'
              : 'Not Tested',
          };
        });

        const testedSkills = skillSummaries.filter((s) => s.accuracy !== null);
        const topicAccuracy = testedSkills.length > 0
          ? Math.round(testedSkills.reduce((a, s) => a + s.accuracy, 0) / testedSkills.length)
          : null;

        return {
          topicId: topic.id,
          topicName: topic.name,
          accuracy: topicAccuracy,
          skills: skillSummaries,
        };
      });

      const testedTopics = topicSummaries.filter((t) => t.accuracy !== null);
      const domainAccuracy = testedTopics.length > 0
        ? Math.round(testedTopics.reduce((a, t) => a + t.accuracy, 0) / testedTopics.length)
        : null;

      return {
        domainId: domain.id,
        domainName: domain.name,
        accuracy: domainAccuracy,
        topics: topicSummaries,
      };
    });

    return {
      domains: domainSummaries,
      totalQuestions: answeredQuestions.length,
      totalCorrect: answeredQuestions.filter((a) => a.correct).length,
      totalTime: answeredQuestions.reduce((s, a) => s + (a.time || 0), 0),
    };
  }

  return {
    getSkillInfo,
    getSkillsForQuestion,
    getPrimarySkill,
    getAllSkillIds,
    getDomains,
    getDomainById,
    getTopicById,
    generateReportCard,
    questionSkillMap,
    DOMAINS,
    'CG-001': ['GEO-COORD-LOCI'],
    'CG-002': ['GEO-COORD-LOCI'],
    'CG-003': ['GEO-COORD-LOCI'],
    'CG-004': ['GEO-COORD-LOCI'],
    'CG-005': ['GEO-COORD-LOCI'],
    'CG-006': ['GEO-COORD-LOCI'],
    'CG-007': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-008': ['GEO-COORD-LOCI'],
    'CG-009': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-010': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-011': ['GEO-COORD-LOCI'],
    'CG-012': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-013': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'CG-014': ['GEO-COORD-OPT', 'FUN-QFUN-FEAT'],
    'CG-015': ['GEO-COORD-LOCI'],
    'CG-016': ['GEO-COORD-GQUAD', 'FUN-QFUN-SKETCH'],
    'PR-001': ['NUM-PROP-DIR'],
    'PR-002': ['NUM-PROP-DIR'],
    'PR-003': ['NUM-PROP-INV'],
    'PR-004': ['NUM-PROP-INV'],
    'PR-005': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-006': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-007': ['NUM-PROP-DIR'],
    'PR-008': ['NUM-PROP-INV'],
    'PR-009': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-010': ['NUM-PROP-DIR'],
    'PR-011': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'PR-012': ['NUM-PROP-INV'],
    'PR-013': ['NUM-PROP-DIR'],
    'PR-014': ['NUM-PROP-PHYS', 'NUM-PROP-DIR'],
    'RF-001': ['NUM-RECIP-SKETCH'],
    'RF-002': ['NUM-RECIP-ASYMP'],
    'RF-003': ['NUM-RECIP-ASYMP'],
    'RF-004': ['NUM-RECIP-SKETCH'],
    'RF-005': ['NUM-RECIP-SKETCH'],
    'RF-006': ['NUM-RECIP-ASYMP'],
    'RF-007': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],
    'RF-008': ['NUM-RECIP-SKETCH'],
    'RF-009': ['NUM-RECIP-ASYMP'],
    'RF-010': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],
    'RF-011': ['NUM-RECIP-SKETCH'],
    'RF-012': ['NUM-RECIP-ASYMP', 'GEO-COORD-LOCI'],
    'RQ-001': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-002': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-003': ['FUN-ROOTS-COEF'],
    'RQ-004': ['FUN-ROOTS-COEF'],
    'RQ-005': ['FUN-ROOTS-COEF'],
    'RQ-006': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-007': ['FUN-ROOTS-COEF'],
    'RQ-008': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-009': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-010': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-011': ['FUN-ROOTS-COEF'],
    'RQ-012': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-013': ['FUN-ROOTS-COEF'],
    'RQ-014': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],
    'RQ-015': ['FUN-ROOTS-APP', 'FUN-ROOTS-COEF'],
    'RQ-016': ['FUN-ROOTS-COEF'],
    'RQ-017': ['FUN-ROOTS-BEH', 'ALG-QUAD-DISC'],

    // Circles and Semicircles
    'CS-001': ['GEO-CIRC-SKETCH'],
    'CS-002': ['GEO-CIRC-SKETCH'],
    'CS-003': ['GEO-CIRC-SEMI'],
    'CS-004': ['GEO-CIRC-SEMI'],
    'CS-005': ['GEO-CIRC-FUR', 'GEO-COORD-LOCI'],
    'CS-006': ['GEO-CIRC-SKETCH', 'GEO-COORD-LOCI'],
    'CS-007': ['GEO-CIRC-FUR', 'GEO-CIRCLE-TANG'],
    'CS-008': ['GEO-CIRC-SKETCH', 'GEO-COORD-LOCI'],
    'CS-009': ['GEO-CIRC-FUR'],
    'CS-010': ['GEO-CIRC-SEMI'],
    'CS-011': ['GEO-CIRC-FUR', 'GEO-COORD-LOCI'],
    'CS-012': ['GEO-CIRC-SKETCH', 'GEO-FPG-QUAD'],

    // Congruence and Similarity
    'CSM-001': ['GEO-CONG-CTRI'],
    'CSM-002': ['GEO-CONG-STRI'],
    'CSM-003': ['GEO-CONG-STRI'],
    'CSM-004': ['GEO-CONG-CTRI'],
    'CSM-005': ['GEO-CONG-STRI'],
    'CSM-006': ['GEO-CONG-TRANS', 'GEO-COORD-LOCI'],
    'CSM-007': ['GEO-CONG-STRI'],
    'CSM-008': ['GEO-CONG-TRANS'],
    'CSM-009': ['GEO-CONG-CTRI', 'GEO-COORD-LOCI'],
    'CSM-010': ['GEO-CONG-STRI', 'GEO-CIRCLE-CYCL'],

    // Further Plane Geometry
    'FPG-001': ['GEO-FPG-LEN'],
    'FPG-002': ['GEO-FPG-QUAD'],
    'FPG-003': ['GEO-FPG-POLY'],
    'FPG-004': ['GEO-FPG-LEN', 'GEO-FPG-QUAD'],
    'FPG-005': ['GEO-FPG-QUAD'],
    'FPG-006': ['GEO-FPG-POLY'],
    'FPG-007': ['GEO-FPG-LEN'],
    'FPG-008': ['GEO-FPG-QUAD'],

    // Circle Geometry
    'CIR-001': ['GEO-CIRCLE-COMP', 'GEO-CIRCLE-ANG'],
    'CIR-002': ['GEO-CIRCLE-ANG'],
    'CIR-003': ['GEO-CIRCLE-COMP'],
    'CIR-004': ['GEO-CIRCLE-CYCL'],
    'CIR-005': ['GEO-CIRCLE-ANG'],
    'CIR-006': ['GEO-CIRCLE-CYCL'],
    'CIR-007': ['GEO-CIRCLE-COMP', 'GEO-CIRCLE-TANG'],
    'CIR-008': ['GEO-CIRCLE-TANG', 'GEO-CIRCLE-ANG'],
    'CIR-009': ['GEO-CIRCLE-CYCL'],


    // Trigonometry
    'TRG-001': ['TRIG-CIRC-FUNC'],
    'TRG-002': ['TRIG-CIRC-FUNC'],
    'TRG-003': ['TRIG-CIRC-FUNC'],
    'TRG-004': ['TRIG-CIRC-FUNC'],
    'TRG-005': ['TRIG-CIRC-FUNC'],
    'TRG-006': ['TRIG-CIRC-ID'],
    'TRG-007': ['TRIG-CIRC-ID', 'TRIG-CIRC-REL'],
    'TRG-008': ['TRIG-FORM-INCL'],
    'TRG-009': ['TRIG-FORM-AREA'],
    'TRG-010': ['TRIG-FORM-SOLVE'],
    'TRG-011': ['TRIG-CIRC-REL'],
    'TRG-012': ['TRIG-FORM-AREA'],
    'TRG-013': ['TRIG-CIRC-ID'],
    'TRG-014': ['TRIG-FORM-SOLVE'],

    // Exponential Function
    'EXP-001': ['FUN-EXP-REL'],
    'EXP-002': ['FUN-EXP-REL'],
    'EXP-003': ['FUN-EXP-REL'],
    'EXP-004': ['FUN-EXP-REL'],
    'EXP-005': ['FUN-EXP-REL'],
    'EXP-006': ['FUN-EXP-REL'],
    'EXP-007': ['FUN-EXP-GROW'],
    'EXP-008': ['FUN-EXP-EQN'],
    'EXP-009': ['FUN-EXP-GROW'],
    'EXP-010': ['FUN-EXP-EQN'],

    // Logarithmic Function
    'LOG-001': ['FUN-LOG-DEF'],
    'LOG-002': ['FUN-LOG-EVAL'],
    'LOG-003': ['FUN-LOG-EVAL'],
    'LOG-004': ['FUN-LOG-LAWS'],
    'LOG-005': ['FUN-LOG-LAWS'],
    'LOG-006': ['FUN-LOG-LAWS'],
    'LOG-007': ['FUN-LOG-EVAL'],
    'LOG-008': ['FUN-LOG-EQN'],
    'LOG-009': ['FUN-LOG-EQN'],
    'LOG-010': ['FUN-LOG-LAWS'],

    // Statistics and Probability
    'STP-001': ['STAT-UNI-SPREAD'],
    'STP-002': ['STAT-UNI-QUART'],
    'STP-003': ['STAT-UNI-SPREAD'],
    'STP-004': ['STAT-UNI-QUART'],
    'STP-005': ['STAT-PROB-BASIC'],
    'STP-006': ['STAT-PROB-BASIC'],
    'STP-007': ['STAT-PROB-BASIC'],
    'STP-008': ['STAT-UNI-QUART', 'STAT-REP-BOX'],
    'STP-009': ['STAT-PROB-BASIC'],
    'STP-010': ['STAT-PROB-BASIC'],
    'STP-011': ['STAT-BIV-CORR', 'STAT-REP-SCAT'],
    'STP-012': ['STAT-UNI-QUART'],
    'STP-013': ['STAT-PROB-BASIC'],
    'STP-014': ['STAT-PROB-BASIC'],
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillTaxonomy;
}
