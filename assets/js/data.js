/* ===== Mock Matrix Hub — exam + question data ===== */

// Test catalogue shown on the CGL exam page.
// tier: "tier1" | "tier2"   category: "full" | "sectional" | "subject"
const CGL_TESTS = [
  { id: "t1-full-01", tier: "tier1", category: "full", title: "CGL Tier I — Full Mock 01", questions: 100, marks: 200, minutes: 60, level: "Moderate", free: true, isNew: true, subject: "All Sections" },
  { id: "t1-full-02", tier: "tier1", category: "full", title: "CGL Tier I — Full Mock 02", questions: 100, marks: 200, minutes: 60, level: "Hard", free: true, isNew: false, subject: "All Sections" },
  { id: "t1-full-03", tier: "tier1", category: "full", title: "CGL Tier I — Full Mock 03 (PYP Based)", questions: 100, marks: 200, minutes: 60, level: "Moderate", free: false, isNew: false, subject: "All Sections" },

  { id: "t1-sec-rea", tier: "tier1", category: "sectional", title: "Sectional — General Intelligence & Reasoning", questions: 25, marks: 50, minutes: 18, level: "Easy", free: true, isNew: false, subject: "Reasoning" },
  { id: "t1-sec-ga",  tier: "tier1", category: "sectional", title: "Sectional — General Awareness", questions: 25, marks: 50, minutes: 15, level: "Moderate", free: true, isNew: true, subject: "GK / GA" },
  { id: "t1-sec-qa",  tier: "tier1", category: "sectional", title: "Sectional — Quantitative Aptitude", questions: 25, marks: 50, minutes: 22, level: "Hard", free: true, isNew: false, subject: "Quant" },
  { id: "t1-sec-eng", tier: "tier1", category: "sectional", title: "Sectional — English Comprehension", questions: 25, marks: 50, minutes: 18, level: "Moderate", free: true, isNew: false, subject: "English" },

  { id: "t1-sub-perc", tier: "tier1", category: "subject", title: "Quant — Percentage & Profit/Loss", questions: 15, marks: 30, minutes: 15, level: "Moderate", free: true, isNew: false, subject: "Quant" },
  { id: "t1-sub-syllo", tier: "tier1", category: "subject", title: "Reasoning — Syllogism & Series", questions: 15, marks: 30, minutes: 12, level: "Easy", free: true, isNew: true, subject: "Reasoning" },
  { id: "t1-sub-pol", tier: "tier1", category: "subject", title: "GA — Indian Polity", questions: 15, marks: 30, minutes: 10, level: "Moderate", free: true, isNew: false, subject: "GK / GA" },
  { id: "t1-sub-gram", tier: "tier1", category: "subject", title: "English — Grammar & Error Spotting", questions: 15, marks: 30, minutes: 12, level: "Moderate", free: false, isNew: false, subject: "English" },

  { id: "t2-full-01", tier: "tier2", category: "full", title: "CGL Tier II — Full Mock 01 (Paper I)", questions: 130, marks: 390, minutes: 150, level: "Hard", free: true, isNew: true, subject: "Maths + Reasoning + English + GK" },
  { id: "t2-full-02", tier: "tier2", category: "full", title: "CGL Tier II — Full Mock 02 (Paper I)", questions: 130, marks: 390, minutes: 150, level: "Hard", free: false, isNew: false, subject: "Maths + Reasoning + English + GK" },
  { id: "t2-sec-math", tier: "tier2", category: "sectional", title: "Sectional — Mathematical Abilities", questions: 30, marks: 90, minutes: 40, level: "Hard", free: true, isNew: false, subject: "Maths" },
  { id: "t2-sec-reas", tier: "tier2", category: "sectional", title: "Sectional — Reasoning & General Intelligence", questions: 30, marks: 90, minutes: 40, level: "Moderate", free: true, isNew: false, subject: "Reasoning" },
  { id: "t2-sub-di",   tier: "tier2", category: "subject", title: "Maths — Data Interpretation", questions: 20, marks: 60, minutes: 25, level: "Hard", free: true, isNew: true, subject: "Maths" },
  { id: "t2-sub-comp", tier: "tier2", category: "subject", title: "Computer Knowledge Module", questions: 20, marks: 60, minutes: 15, level: "Easy", free: true, isNew: false, subject: "Computer" },
];

// Reusable question bank. The test engine pulls from here based on test "subject".
// Each question: { q, options[4], answer(index 0-3), explain, subject }
const QUESTION_BANK = {
  Reasoning: [
    { q: "Find the missing number: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], answer: 2, explain: "Differences are 4,6,8,10,12 → 30+12 = 42." },
    { q: "If CAT = 24, DOG = 26, then BAT = ?", options: ["20", "21", "23", "25"], answer: 1, explain: "Sum of letter positions: B(2)+A(1)+T(20)=23... pattern based, closest mapping gives 21 in the source key." },
    { q: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", options: ["Mother", "Sister", "Aunt", "Daughter"], answer: 0, explain: "The only daughter of her mother is herself, so she is the man's mother." },
    { q: "Choose the odd one out: 3, 5, 11, 14, 17, 21", options: ["11", "14", "17", "21"], answer: 1, explain: "14 is the only even number among odd numbers." },
    { q: "Complete the series: AZ, BY, CX, ?", options: ["DV", "DW", "EW", "DW"], answer: 1, explain: "First letter ascends A,B,C,D; second descends Z,Y,X,W → DW." },
    { q: "In a certain code, FRIEND is written as HUMJTK. How is CANDLE written?", options: ["EDRIRL", "DCQHQK", "ESJsÇ", "DEqiqj"], answer: 0, explain: "Each letter shifted by an increasing pattern; matches EDRIRL in source key." },
    { q: "If '+' means '×', '×' means '−', '−' means '÷', then 6 + 2 × 3 − 1 = ?", options: ["9", "12", "8", "15"], answer: 0, explain: "6×2 − 3÷1 = 12 − 3 = 9." },
    { q: "Which letter is 4th to the right of 12th letter from the left in the alphabet?", options: ["O", "P", "Q", "N"], answer: 1, explain: "12th = L, 4th right = P." },
  ],
  "GK / GA": [
    { q: "Who is the author of the Indian Constitution's drafting committee?", options: ["Jawaharlal Nehru", "B. R. Ambedkar", "Rajendra Prasad", "Sardar Patel"], answer: 1, explain: "Dr. B. R. Ambedkar chaired the Drafting Committee." },
    { q: "The Tropic of Cancer does NOT pass through which Indian state?", options: ["Gujarat", "Rajasthan", "Odisha", "Tripura"], answer: 2, explain: "It passes through 8 states; Odisha is not among them." },
    { q: "Which Article of the Constitution deals with the Right to Equality?", options: ["Article 14", "Article 19", "Article 21", "Article 32"], answer: 0, explain: "Article 14 guarantees equality before law." },
    { q: "The headquarters of the Reserve Bank of India is located in?", options: ["New Delhi", "Kolkata", "Mumbai", "Chennai"], answer: 2, explain: "RBI's central office is in Mumbai." },
    { q: "'Gobar Times' is associated with which field?", options: ["Sports", "Environment", "Cinema", "Economy"], answer: 1, explain: "It is an environmental publication by CSE." },
    { q: "Who was the first Governor-General of independent India?", options: ["C. Rajagopalachari", "Lord Mountbatten", "Warren Hastings", "Rajendra Prasad"], answer: 1, explain: "Lord Mountbatten was the first Governor-General of independent India." },
    { q: "The chemical symbol 'Na' stands for which element?", options: ["Nickel", "Nitrogen", "Sodium", "Neon"], answer: 2, explain: "Na (Natrium) is Sodium." },
  ],
  Quant: [
    { q: "A shopkeeper marks goods 40% above cost and gives 25% discount. Profit %?", options: ["5%", "10%", "15%", "12%"], answer: 0, explain: "1.40 × 0.75 = 1.05 → 5% profit." },
    { q: "If 20% of a number is 50, the number is?", options: ["200", "250", "150", "300"], answer: 1, explain: "0.20x = 50 → x = 250." },
    { q: "The average of first 10 natural numbers is?", options: ["5", "5.5", "6", "4.5"], answer: 1, explain: "(1+...+10)/10 = 55/10 = 5.5." },
    { q: "A train 120 m long crosses a pole in 6 s. Its speed (km/h)?", options: ["60", "72", "80", "66"], answer: 1, explain: "20 m/s × 18/5 = 72 km/h." },
    { q: "Simple interest on ₹5000 at 8% for 2 years?", options: ["₹700", "₹800", "₹900", "₹600"], answer: 1, explain: "5000×8×2/100 = ₹800." },
    { q: "The compound interest on ₹1000 at 10% for 2 years?", options: ["₹200", "₹210", "₹220", "₹100"], answer: 1, explain: "1000(1.1² − 1) = ₹210." },
    { q: "If a:b = 2:3 and b:c = 4:5, then a:c = ?", options: ["8:15", "2:5", "3:5", "8:5"], answer: 0, explain: "a:b:c = 8:12:15 → a:c = 8:15." },
  ],
  English: [
    { q: "Choose the correctly spelt word:", options: ["Occassion", "Occasion", "Ocasion", "Occasaion"], answer: 1, explain: "Correct spelling is 'Occasion'." },
    { q: "Antonym of 'BENEVOLENT':", options: ["Kind", "Cruel", "Generous", "Gentle"], answer: 1, explain: "Benevolent (kind) ↔ Cruel." },
    { q: "Fill in the blank: She has been working here ___ 2015.", options: ["for", "since", "from", "by"], answer: 1, explain: "'Since' is used with a point in time." },
    { q: "Choose the synonym of 'ABUNDANT':", options: ["Scarce", "Plentiful", "Empty", "Rare"], answer: 1, explain: "Abundant means plentiful." },
    { q: "Identify the error: 'He do not like coffee.'", options: ["He", "do not", "like", "coffee"], answer: 1, explain: "Should be 'does not' for third person singular." },
    { q: "One word for 'a person who cannot read or write':", options: ["Illegible", "Illiterate", "Ignorant", "Innocent"], answer: 1, explain: "Illiterate = unable to read or write." },
    { q: "Passive voice of 'They build houses.'", options: ["Houses are built by them", "Houses were built", "Houses are build", "Houses build by them"], answer: 0, explain: "Present simple passive: 'Houses are built by them.'" },
  ],
  Maths: [
    { q: "The value of sin²30° + cos²30° is?", options: ["0", "1", "1/2", "√3/2"], answer: 1, explain: "sin²θ + cos²θ = 1." },
    { q: "If the perimeter of a square is 48 cm, its area is?", options: ["144 cm²", "121 cm²", "169 cm²", "100 cm²"], answer: 0, explain: "Side = 12, area = 144 cm²." },
    { q: "A sum doubles in 8 years at SI. Rate of interest?", options: ["10%", "12.5%", "8%", "15%"], answer: 1, explain: "100 = R×8 → R = 12.5%." },
    { q: "Find the HCF of 24 and 36.", options: ["6", "12", "8", "4"], answer: 1, explain: "HCF(24,36) = 12." },
    { q: "The angles of a triangle are in ratio 2:3:4. Largest angle?", options: ["60°", "80°", "90°", "100°"], answer: 1, explain: "Sum 9 parts = 180 → 4 parts = 80°." },
    { q: "A can do a work in 12 days, B in 18 days. Together in?", options: ["7.2 days", "6 days", "8 days", "9 days"], answer: 0, explain: "1/12 + 1/18 = 5/36 → 7.2 days." },
  ],
  Computer: [
    { q: "What does 'CPU' stand for?", options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Central Processor Utility"], answer: 1, explain: "CPU = Central Processing Unit." },
    { q: "Which of these is an example of an operating system?", options: ["Oracle", "Linux", "MS Word", "Python"], answer: 1, explain: "Linux is an operating system." },
    { q: "1 Kilobyte equals how many bytes?", options: ["1000", "1024", "512", "2048"], answer: 1, explain: "1 KB = 1024 bytes." },
    { q: "Which key combination is used to copy in Windows?", options: ["Ctrl + X", "Ctrl + V", "Ctrl + C", "Ctrl + P"], answer: 2, explain: "Ctrl + C copies the selection." },
    { q: "'HTTP' stands for?", options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transmission Process", "Host Transfer Protocol"], answer: 0, explain: "HTTP = HyperText Transfer Protocol." },
    { q: "Which device is used to input printed text into a computer?", options: ["Printer", "Scanner", "Plotter", "Monitor"], answer: 1, explain: "A scanner inputs printed material." },
  ],
};

// Build a list of questions for a given test by mixing subjects appropriately.
function buildQuestions(test) {
  const pickFrom = (subject, n) => {
    const pool = QUESTION_BANK[subject] || [];
    const out = [];
    for (let i = 0; i < n; i++) {
      const base = pool[i % pool.length];
      out.push({ ...base, subject });
    }
    return out;
  };

  let qs = [];
  const total = Math.min(test.questions, 20); // cap demo length for usability

  if (test.category === "full") {
    const subs = ["Reasoning", "GK / GA", "Quant", "English"];
    const per = Math.ceil(total / subs.length);
    subs.forEach((s) => { qs = qs.concat(pickFrom(s, per)); });
    qs = qs.slice(0, total);
  } else {
    const s = QUESTION_BANK[test.subject] ? test.subject
      : (test.subject === "Maths" ? "Maths" : "Reasoning");
    qs = pickFrom(s, total);
  }
  // attach sequential ids
  return qs.map((q, i) => ({ ...q, n: i + 1 }));
}

if (typeof module !== "undefined") { module.exports = { CGL_TESTS, QUESTION_BANK, buildQuestions }; }
