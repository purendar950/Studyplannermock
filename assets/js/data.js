/* ============================================================
 *  Study Planner Mock — multi-exam catalogue + question bank
 *
 *  This file powers the "demo mode" (no backend) experience and
 *  is also the single source of truth for which exams / test
 *  series exist. The same shapes are mirrored in Supabase so the
 *  app behaves identically whether or not a backend is wired up.
 *
 *  Data model
 *  ----------
 *  EXAMS[]     — the catalogue of exams, grouped by category.
 *  exam.papers — each exam has one or more "papers"/tiers, and
 *                each paper lists the subjects it covers.
 *  buildExamTests(exam) generates a realistic test series
 *                (full mocks, sectionals, subject-wise) for an exam.
 *  QUESTION_BANK — subject-keyed pool of questions used by tests.
 * ============================================================ */

/* ---------- subject templates (label + question-bank key) ---------- */
const SUBJECTS = {
  REASONING: { label: "Reasoning Ability", bank: "Reasoning" },
  GI: { label: "General Intelligence & Reasoning", bank: "Reasoning" },
  QUANT: { label: "Quantitative Aptitude", bank: "Quant" },
  NUM: { label: "Numerical Ability", bank: "Quant" },
  MATHS: { label: "Mathematics", bank: "Maths" },
  ENGLISH: { label: "English Language", bank: "English" },
  GA: { label: "General Awareness", bank: "GK / GA" },
  GK: { label: "General Knowledge", bank: "GK / GA" },
  GS: { label: "General Science", bank: "General Science" },
  CA: { label: "Current Affairs", bank: "Current Affairs" },
  COMPUTER: { label: "Computer Knowledge", bank: "Computer" },
};

/* ---------- the exam catalogue (grouped, Testbook-style) ---------- */
const EXAMS = [
  /* ===== SSC ===== */
  {
    slug: "ssc-cgl", group: "SSC", name: "SSC CGL", icon: "📘", status: "live", popular: true,
    tagline: "Combined Graduate Level — Tier I & Tier II",
    papers: [
      { key: "tier1", label: "Tier I", fullMocks: 5, questions: 100, marks: 200, minutes: 60,
        subjects: [SUBJECTS.GI, SUBJECTS.GA, SUBJECTS.QUANT, SUBJECTS.ENGLISH] },
      { key: "tier2", label: "Tier II", fullMocks: 3, questions: 130, marks: 390, minutes: 150,
        subjects: [SUBJECTS.MATHS, SUBJECTS.REASONING, SUBJECTS.ENGLISH, SUBJECTS.GK, SUBJECTS.COMPUTER] },
    ],
  },
  {
    slug: "ssc-chsl", group: "SSC", name: "SSC CHSL", icon: "📗", status: "live", popular: true,
    tagline: "Combined Higher Secondary (10+2) Level",
    papers: [
      { key: "tier1", label: "Tier I", fullMocks: 4, questions: 100, marks: 200, minutes: 60,
        subjects: [SUBJECTS.GI, SUBJECTS.GA, SUBJECTS.QUANT, SUBJECTS.ENGLISH] },
    ],
  },
  {
    slug: "ssc-mts", group: "SSC", name: "SSC MTS", icon: "📒", status: "live",
    tagline: "Multi Tasking (Non-Technical) Staff",
    papers: [
      { key: "paper1", label: "Session I & II", fullMocks: 3, questions: 90, marks: 270, minutes: 90,
        subjects: [SUBJECTS.NUM, SUBJECTS.REASONING, SUBJECTS.GA, SUBJECTS.ENGLISH] },
    ],
  },
  {
    slug: "ssc-gd", group: "SSC", name: "SSC GD Constable", icon: "🛡️", status: "live",
    tagline: "General Duty Constable (CAPF / NIA / SSF)",
    papers: [
      { key: "paper1", label: "Computer Based Test", fullMocks: 3, questions: 80, marks: 160, minutes: 60,
        subjects: [SUBJECTS.GI, SUBJECTS.GK, SUBJECTS.NUM, SUBJECTS.ENGLISH] },
    ],
  },

  /* ===== Banking & Insurance ===== */
  {
    slug: "ibps-po", group: "Banking", name: "IBPS PO", icon: "🏦", status: "live", popular: true,
    tagline: "Probationary Officer — Prelims & Mains",
    papers: [
      { key: "prelims", label: "Prelims", fullMocks: 4, questions: 100, marks: 100, minutes: 60,
        subjects: [SUBJECTS.ENGLISH, SUBJECTS.NUM, SUBJECTS.REASONING] },
      { key: "mains", label: "Mains", fullMocks: 2, questions: 155, marks: 200, minutes: 180,
        subjects: [SUBJECTS.REASONING, SUBJECTS.ENGLISH, SUBJECTS.NUM, SUBJECTS.GA, SUBJECTS.COMPUTER] },
    ],
  },
  {
    slug: "ibps-clerk", group: "Banking", name: "IBPS Clerk", icon: "💳", status: "live",
    tagline: "Clerical Cadre — Prelims & Mains",
    papers: [
      { key: "prelims", label: "Prelims", fullMocks: 4, questions: 100, marks: 100, minutes: 60,
        subjects: [SUBJECTS.ENGLISH, SUBJECTS.NUM, SUBJECTS.REASONING] },
    ],
  },
  {
    slug: "sbi-po", group: "Banking", name: "SBI PO", icon: "🏛️", status: "live", popular: true,
    tagline: "State Bank of India — Probationary Officer",
    papers: [
      { key: "prelims", label: "Prelims", fullMocks: 3, questions: 100, marks: 100, minutes: 60,
        subjects: [SUBJECTS.ENGLISH, SUBJECTS.NUM, SUBJECTS.REASONING] },
    ],
  },
  {
    slug: "rbi-grade-b", group: "Banking", name: "RBI Grade B", icon: "💹", status: "live",
    tagline: "Reserve Bank of India — Officer Grade B",
    papers: [
      { key: "prelims", label: "Phase I", fullMocks: 2, questions: 200, marks: 200, minutes: 120,
        subjects: [SUBJECTS.GA, SUBJECTS.QUANT, SUBJECTS.ENGLISH, SUBJECTS.REASONING] },
    ],
  },

  /* ===== Railways ===== */
  {
    slug: "rrb-ntpc", group: "Railways", name: "RRB NTPC", icon: "🚆", status: "live", popular: true,
    tagline: "Non-Technical Popular Categories",
    papers: [
      { key: "cbt1", label: "CBT 1", fullMocks: 4, questions: 100, marks: 100, minutes: 90,
        subjects: [SUBJECTS.MATHS, SUBJECTS.GI, SUBJECTS.GA] },
    ],
  },
  {
    slug: "rrb-group-d", group: "Railways", name: "RRB Group D", icon: "🚉", status: "live",
    tagline: "Level-1 posts — Computer Based Test",
    papers: [
      { key: "cbt", label: "CBT", fullMocks: 3, questions: 100, marks: 100, minutes: 90,
        subjects: [SUBJECTS.MATHS, SUBJECTS.GI, SUBJECTS.GS, SUBJECTS.GA] },
    ],
  },
  {
    slug: "rrb-alp", group: "Railways", name: "RRB ALP", icon: "🛤️", status: "live",
    tagline: "Assistant Loco Pilot & Technician",
    papers: [
      { key: "cbt1", label: "CBT 1", fullMocks: 2, questions: 75, marks: 75, minutes: 60,
        subjects: [SUBJECTS.MATHS, SUBJECTS.GI, SUBJECTS.GS, SUBJECTS.GA] },
    ],
  },

  /* ===== Teaching ===== */
  {
    slug: "ctet", group: "Teaching", name: "CTET", icon: "🧑‍🏫", status: "live",
    tagline: "Central Teacher Eligibility Test — Paper I & II",
    papers: [
      { key: "paper1", label: "Paper I", fullMocks: 3, questions: 150, marks: 150, minutes: 150,
        subjects: [SUBJECTS.GK, SUBJECTS.MATHS, SUBJECTS.ENGLISH, SUBJECTS.GS] },
    ],
  },
  {
    slug: "uptet", group: "Teaching", name: "UPTET", icon: "📚", status: "live",
    tagline: "Uttar Pradesh Teacher Eligibility Test",
    papers: [
      { key: "paper1", label: "Paper I", fullMocks: 2, questions: 150, marks: 150, minutes: 150,
        subjects: [SUBJECTS.GK, SUBJECTS.MATHS, SUBJECTS.ENGLISH, SUBJECTS.GS] },
    ],
  },

  /* ===== Defence ===== */
  {
    slug: "nda", group: "Defence", name: "NDA", icon: "🎖️", status: "live", popular: true,
    tagline: "National Defence Academy & Naval Academy",
    papers: [
      { key: "paper1", label: "Maths + GAT", fullMocks: 3, questions: 150, marks: 600, minutes: 150,
        subjects: [SUBJECTS.MATHS, SUBJECTS.ENGLISH, SUBJECTS.GS, SUBJECTS.GK] },
    ],
  },
  {
    slug: "cds", group: "Defence", name: "CDS", icon: "⚔️", status: "live",
    tagline: "Combined Defence Services Examination",
    papers: [
      { key: "paper1", label: "Written Exam", fullMocks: 2, questions: 120, marks: 300, minutes: 120,
        subjects: [SUBJECTS.ENGLISH, SUBJECTS.GK, SUBJECTS.MATHS] },
    ],
  },

  /* ===== Civil Services / State ===== */
  {
    slug: "upsc-prelims", group: "Civil Services", name: "UPSC Prelims", icon: "🏆", status: "live", popular: true,
    tagline: "Civil Services (Preliminary) — GS Paper I",
    papers: [
      { key: "gs1", label: "GS Paper I", fullMocks: 3, questions: 100, marks: 200, minutes: 120,
        subjects: [SUBJECTS.GK, SUBJECTS.CA, SUBJECTS.GS] },
    ],
  },
  {
    slug: "state-psc", group: "Civil Services", name: "State PSC", icon: "🗺️", status: "live",
    tagline: "State Public Service Commission — Prelims",
    papers: [
      { key: "prelims", label: "Prelims", fullMocks: 2, questions: 100, marks: 200, minutes: 120,
        subjects: [SUBJECTS.GK, SUBJECTS.CA, SUBJECTS.GS, SUBJECTS.REASONING] },
    ],
  },
];

/* ---------- exam lookup helpers ---------- */
function getExam(slug) { return EXAMS.find((e) => e.slug === slug) || null; }

function getExamGroups() {
  const groups = {};
  EXAMS.forEach((e) => { (groups[e.group] = groups[e.group] || []).push(e); });
  return groups;
}

/* ---------- difficulty cycling so a series feels varied ---------- */
const LEVELS = ["Easy", "Moderate", "Hard"];
const pad2 = (n) => String(n).padStart(2, "0");

/* ---------- generate a full test series for an exam ---------- */
function buildExamTests(exam) {
  const tests = [];

  exam.papers.forEach((paper) => {
    const allBanks = paper.subjects.map((s) => s.bank);
    const perQMark = +(paper.marks / paper.questions).toFixed(2) || 1;

    /* full mocks across all subjects of this paper */
    for (let i = 1; i <= paper.fullMocks; i++) {
      tests.push({
        id: `${exam.slug}-${paper.key}-full-${pad2(i)}`,
        examSlug: exam.slug,
        tier: paper.key,
        tierLabel: paper.label,
        category: "full",
        title: `${exam.name} ${paper.label} — Full Mock ${pad2(i)}`,
        questions: paper.questions,
        marks: paper.marks,
        minutes: paper.minutes,
        level: LEVELS[i % LEVELS.length],
        subject: "All Sections",
        banks: allBanks,
        free: i <= 2,
        isNew: i === 1,
      });
    }

    /* one sectional per subject */
    const secQ = 25;
    paper.subjects.forEach((s, si) => {
      tests.push({
        id: `${exam.slug}-${paper.key}-sec-${si}`,
        examSlug: exam.slug,
        tier: paper.key,
        tierLabel: paper.label,
        category: "sectional",
        title: `Sectional — ${s.label}`,
        questions: secQ,
        marks: Math.round(secQ * perQMark) || secQ * 2,
        minutes: 20,
        level: LEVELS[si % LEVELS.length],
        subject: s.label,
        banks: [s.bank],
        free: si < 3,
        isNew: si === 0,
      });
    });

    /* subject-wise practice (shorter) for each subject */
    const subQ = 15;
    paper.subjects.forEach((s, si) => {
      tests.push({
        id: `${exam.slug}-${paper.key}-sub-${si}`,
        examSlug: exam.slug,
        tier: paper.key,
        tierLabel: paper.label,
        category: "subject",
        title: `${s.label} — Practice Set ${pad2(si + 1)}`,
        questions: subQ,
        marks: Math.round(subQ * perQMark) || subQ * 2,
        minutes: 12,
        level: LEVELS[(si + 1) % LEVELS.length],
        subject: s.label,
        banks: [s.bank],
        free: si < 2,
        isNew: false,
      });
    });
  });

  return tests;
}

/* Backward-compatible export used by the legacy CGL page. */
const CGL_TESTS = buildExamTests(getExam("ssc-cgl"));

/* ============================================================
 *  Question bank — subject-keyed pool.
 *  Each question: { q, options[4], answer(index 0-3), explain }
 * ============================================================ */
const QUESTION_BANK = {
  Reasoning: [
    { q: "Find the missing number: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], answer: 2, explain: "Differences are 4,6,8,10,12 → 30+12 = 42." },
    { q: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", options: ["Mother", "Sister", "Aunt", "Daughter"], answer: 0, explain: "The only daughter of her mother is herself, so she is the man's mother." },
    { q: "Choose the odd one out: 3, 5, 11, 14, 17, 21", options: ["11", "14", "17", "21"], answer: 1, explain: "14 is the only even number among odd numbers." },
    { q: "Complete the series: AZ, BY, CX, ?", options: ["DV", "DW", "EW", "CV"], answer: 1, explain: "First letter ascends A,B,C,D; second descends Z,Y,X,W → DW." },
    { q: "If '+' means '×', '×' means '−', '−' means '÷', then 6 + 2 × 3 − 1 = ?", options: ["9", "12", "8", "15"], answer: 0, explain: "6×2 − 3÷1 = 12 − 3 = 9." },
    { q: "Which letter is 4th to the right of the 12th letter from the left in the alphabet?", options: ["O", "P", "Q", "N"], answer: 1, explain: "12th = L, 4th to the right = P." },
    { q: "If in a code TEACHER is written as VGCEJGT, how is STUDENT written?", options: ["UVWFGPV", "UWVFGPV", "UVWGFPV", "UVWFGVP"], answer: 0, explain: "Each letter is shifted forward by 2 → UVWFGPV." },
    { q: "A is the brother of B. B is the sister of C. How is A related to C?", options: ["Brother", "Sister", "Brother or Sister", "Cannot be determined"], answer: 0, explain: "A is male (brother), so A is the brother of C." },
  ],
  "GK / GA": [
    { q: "Who chaired the Drafting Committee of the Indian Constitution?", options: ["Jawaharlal Nehru", "B. R. Ambedkar", "Rajendra Prasad", "Sardar Patel"], answer: 1, explain: "Dr. B. R. Ambedkar chaired the Drafting Committee." },
    { q: "The Tropic of Cancer does NOT pass through which Indian state?", options: ["Gujarat", "Rajasthan", "Odisha", "Tripura"], answer: 2, explain: "It passes through 8 states; Odisha is not among them." },
    { q: "Which Article of the Constitution deals with the Right to Equality?", options: ["Article 14", "Article 19", "Article 21", "Article 32"], answer: 0, explain: "Article 14 guarantees equality before the law." },
    { q: "The headquarters of the Reserve Bank of India is located in?", options: ["New Delhi", "Kolkata", "Mumbai", "Chennai"], answer: 2, explain: "RBI's central office is in Mumbai." },
    { q: "Who was the first Governor-General of independent India?", options: ["C. Rajagopalachari", "Lord Mountbatten", "Warren Hastings", "Rajendra Prasad"], answer: 1, explain: "Lord Mountbatten was the first Governor-General of independent India." },
    { q: "The chemical symbol 'Na' stands for which element?", options: ["Nickel", "Nitrogen", "Sodium", "Neon"], answer: 2, explain: "Na (Natrium) is Sodium." },
    { q: "In which year was the Reserve Bank of India established?", options: ["1935", "1947", "1949", "1950"], answer: 0, explain: "RBI was established on 1 April 1935." },
    { q: "Which river is known as the 'Sorrow of Bihar'?", options: ["Ganga", "Kosi", "Son", "Gandak"], answer: 1, explain: "The Kosi river is called the Sorrow of Bihar due to frequent floods." },
  ],
  Quant: [
    { q: "A shopkeeper marks goods 40% above cost and gives a 25% discount. Profit %?", options: ["5%", "10%", "15%", "12%"], answer: 0, explain: "1.40 × 0.75 = 1.05 → 5% profit." },
    { q: "If 20% of a number is 50, the number is?", options: ["200", "250", "150", "300"], answer: 1, explain: "0.20x = 50 → x = 250." },
    { q: "The average of the first 10 natural numbers is?", options: ["5", "5.5", "6", "4.5"], answer: 1, explain: "(1+...+10)/10 = 55/10 = 5.5." },
    { q: "A train 120 m long crosses a pole in 6 s. Its speed (km/h)?", options: ["60", "72", "80", "66"], answer: 1, explain: "20 m/s × 18/5 = 72 km/h." },
    { q: "Simple interest on ₹5000 at 8% for 2 years?", options: ["₹700", "₹800", "₹900", "₹600"], answer: 1, explain: "5000×8×2/100 = ₹800." },
    { q: "The compound interest on ₹1000 at 10% for 2 years?", options: ["₹200", "₹210", "₹220", "₹100"], answer: 1, explain: "1000(1.1² − 1) = ₹210." },
    { q: "If a:b = 2:3 and b:c = 4:5, then a:c = ?", options: ["8:15", "2:5", "3:5", "8:5"], answer: 0, explain: "a:b:c = 8:12:15 → a:c = 8:15." },
    { q: "The value of 15% of 360 is?", options: ["48", "54", "60", "45"], answer: 1, explain: "0.15 × 360 = 54." },
  ],
  English: [
    { q: "Choose the correctly spelt word:", options: ["Occassion", "Occasion", "Ocasion", "Occasaion"], answer: 1, explain: "Correct spelling is 'Occasion'." },
    { q: "Antonym of 'BENEVOLENT':", options: ["Kind", "Cruel", "Generous", "Gentle"], answer: 1, explain: "Benevolent (kind) ↔ Cruel." },
    { q: "Fill in the blank: She has been working here ___ 2015.", options: ["for", "since", "from", "by"], answer: 1, explain: "'Since' is used with a point in time." },
    { q: "Choose the synonym of 'ABUNDANT':", options: ["Scarce", "Plentiful", "Empty", "Rare"], answer: 1, explain: "Abundant means plentiful." },
    { q: "Identify the error: 'He do not like coffee.'", options: ["He", "do not", "like", "coffee"], answer: 1, explain: "Should be 'does not' for third person singular." },
    { q: "One word for 'a person who cannot read or write':", options: ["Illegible", "Illiterate", "Ignorant", "Innocent"], answer: 1, explain: "Illiterate = unable to read or write." },
    { q: "Passive voice of 'They build houses.'", options: ["Houses are built by them", "Houses were built", "Houses are build", "Houses build by them"], answer: 0, explain: "Present simple passive: 'Houses are built by them.'" },
    { q: "Choose the correct idiom meaning 'very easy': 'A piece of ___.'", options: ["cake", "bread", "pie", "art"], answer: 0, explain: "'A piece of cake' means something very easy." },
  ],
  Maths: [
    { q: "The value of sin²30° + cos²30° is?", options: ["0", "1", "1/2", "√3/2"], answer: 1, explain: "sin²θ + cos²θ = 1." },
    { q: "If the perimeter of a square is 48 cm, its area is?", options: ["144 cm²", "121 cm²", "169 cm²", "100 cm²"], answer: 0, explain: "Side = 12, area = 144 cm²." },
    { q: "A sum doubles in 8 years at simple interest. The rate of interest is?", options: ["10%", "12.5%", "8%", "15%"], answer: 1, explain: "100 = R×8 → R = 12.5%." },
    { q: "Find the HCF of 24 and 36.", options: ["6", "12", "8", "4"], answer: 1, explain: "HCF(24,36) = 12." },
    { q: "The angles of a triangle are in the ratio 2:3:4. The largest angle is?", options: ["60°", "80°", "90°", "100°"], answer: 1, explain: "Sum of 9 parts = 180 → 4 parts = 80°." },
    { q: "A can do a work in 12 days, B in 18 days. Together they finish in?", options: ["7.2 days", "6 days", "8 days", "9 days"], answer: 0, explain: "1/12 + 1/18 = 5/36 → 7.2 days." },
    { q: "The square root of 1764 is?", options: ["42", "44", "38", "46"], answer: 0, explain: "42² = 1764." },
  ],
  Computer: [
    { q: "What does 'CPU' stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Processor Utility"], answer: 1, explain: "CPU = Central Processing Unit." },
    { q: "Which of these is an example of an operating system?", options: ["Oracle", "Linux", "MS Word", "Python"], answer: 1, explain: "Linux is an operating system." },
    { q: "1 Kilobyte equals how many bytes?", options: ["1000", "1024", "512", "2048"], answer: 1, explain: "1 KB = 1024 bytes." },
    { q: "Which key combination is used to copy in Windows?", options: ["Ctrl + X", "Ctrl + V", "Ctrl + C", "Ctrl + P"], answer: 2, explain: "Ctrl + C copies the selection." },
    { q: "'HTTP' stands for?", options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Process", "Host Transfer Protocol"], answer: 0, explain: "HTTP = HyperText Transfer Protocol." },
    { q: "Which device is used to input printed text into a computer?", options: ["Printer", "Scanner", "Plotter", "Monitor"], answer: 1, explain: "A scanner inputs printed material." },
  ],
  "General Science": [
    { q: "Which gas is most abundant in the Earth's atmosphere?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], answer: 2, explain: "Nitrogen makes up about 78% of the atmosphere." },
    { q: "The powerhouse of the cell is the?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], answer: 2, explain: "Mitochondria generate most of the cell's energy (ATP)." },
    { q: "The SI unit of force is?", options: ["Joule", "Newton", "Watt", "Pascal"], answer: 1, explain: "Force is measured in newtons (N)." },
    { q: "Which vitamin is produced when skin is exposed to sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], answer: 3, explain: "Sunlight helps the skin synthesise Vitamin D." },
    { q: "The chemical formula of common salt is?", options: ["NaCl", "KCl", "CaCO₃", "NaOH"], answer: 0, explain: "Common salt is sodium chloride, NaCl." },
    { q: "Which part of the human body produces insulin?", options: ["Liver", "Pancreas", "Kidney", "Spleen"], answer: 1, explain: "The pancreas produces insulin." },
  ],
  "Current Affairs": [
    { q: "Which body conducts the Civil Services Examination in India?", options: ["SSC", "UPSC", "IBPS", "RBI"], answer: 1, explain: "The Union Public Service Commission (UPSC) conducts the Civil Services Examination." },
    { q: "The Indian rupee symbol (₹) was officially adopted in which year?", options: ["2008", "2010", "2012", "2014"], answer: 1, explain: "The ₹ symbol was adopted in 2010." },
    { q: "'Digital India' is an initiative of which ministry?", options: ["Ministry of Finance", "Ministry of Electronics & IT", "Ministry of Home Affairs", "Ministry of Education"], answer: 1, explain: "Digital India is led by the Ministry of Electronics & Information Technology." },
    { q: "The headquarters of the United Nations is located in?", options: ["Geneva", "New York", "Paris", "Vienna"], answer: 1, explain: "The UN headquarters is in New York City." },
    { q: "Which scheme provides financial inclusion through zero-balance bank accounts?", options: ["PM-KISAN", "Jan Dhan Yojana", "Ujjwala Yojana", "Ayushman Bharat"], answer: 1, explain: "Pradhan Mantri Jan Dhan Yojana promotes financial inclusion." },
    { q: "The 'Fit India Movement' is associated with which sector?", options: ["Health & Fitness", "Banking", "Agriculture", "Defence"], answer: 0, explain: "The Fit India Movement promotes health and fitness." },
  ],
};

/* Build a list of questions for a test using its declared subject banks.
   Works for full mocks (multiple banks) and sectional/subject tests. */
function buildQuestions(test) {
  const banks = (test.banks && test.banks.length)
    ? test.banks
    : ["Reasoning"]; // safe fallback

  const total = Math.min(test.questions, 20); // cap demo length for usability
  const per = Math.ceil(total / banks.length);

  let qs = [];
  banks.forEach((bank) => {
    const pool = QUESTION_BANK[bank] || QUESTION_BANK.Reasoning;
    for (let i = 0; i < per; i++) {
      const base = pool[i % pool.length];
      qs.push({ ...base, subject: bank });
    }
  });

  qs = qs.slice(0, total);
  return qs.map((q, i) => ({ ...q, n: i + 1 }));
}

if (typeof module !== "undefined") {
  module.exports = { EXAMS, SUBJECTS, getExam, getExamGroups, buildExamTests, CGL_TESTS, QUESTION_BANK, buildQuestions };
}
