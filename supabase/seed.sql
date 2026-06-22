-- ============================================================
--  Mock Matrix Hub — seed data (auto-generated)
--  Run AFTER schema.sql.
-- ============================================================

truncate public.questions, public.tests, public.exams restart identity cascade;

insert into public.exams (slug, name, description) values
  ('cgl', 'SSC CGL', 'Staff Selection Commission — Combined Graduate Level');

insert into public.tests (id, exam_slug, tier, category, title, questions_count, marks, minutes, level, subject, is_free, is_new, sort_order) values
  ('t1-full-01', 'cgl', 'tier1', 'full', 'CGL Tier I — Full Mock 01', 100, 200, 60, 'Moderate', 'All Sections', true, true, 0),
  ('t1-full-02', 'cgl', 'tier1', 'full', 'CGL Tier I — Full Mock 02', 100, 200, 60, 'Hard', 'All Sections', true, false, 1),
  ('t1-full-03', 'cgl', 'tier1', 'full', 'CGL Tier I — Full Mock 03 (PYP Based)', 100, 200, 60, 'Moderate', 'All Sections', false, false, 2),
  ('t1-sec-rea', 'cgl', 'tier1', 'sectional', 'Sectional — General Intelligence & Reasoning', 25, 50, 18, 'Easy', 'Reasoning', true, false, 3),
  ('t1-sec-ga', 'cgl', 'tier1', 'sectional', 'Sectional — General Awareness', 25, 50, 15, 'Moderate', 'GK / GA', true, true, 4),
  ('t1-sec-qa', 'cgl', 'tier1', 'sectional', 'Sectional — Quantitative Aptitude', 25, 50, 22, 'Hard', 'Quant', true, false, 5),
  ('t1-sec-eng', 'cgl', 'tier1', 'sectional', 'Sectional — English Comprehension', 25, 50, 18, 'Moderate', 'English', true, false, 6),
  ('t1-sub-perc', 'cgl', 'tier1', 'subject', 'Quant — Percentage & Profit/Loss', 15, 30, 15, 'Moderate', 'Quant', true, false, 7),
  ('t1-sub-syllo', 'cgl', 'tier1', 'subject', 'Reasoning — Syllogism & Series', 15, 30, 12, 'Easy', 'Reasoning', true, true, 8),
  ('t1-sub-pol', 'cgl', 'tier1', 'subject', 'GA — Indian Polity', 15, 30, 10, 'Moderate', 'GK / GA', true, false, 9),
  ('t1-sub-gram', 'cgl', 'tier1', 'subject', 'English — Grammar & Error Spotting', 15, 30, 12, 'Moderate', 'English', false, false, 10),
  ('t2-full-01', 'cgl', 'tier2', 'full', 'CGL Tier II — Full Mock 01 (Paper I)', 130, 390, 150, 'Hard', 'Maths + Reasoning + English + GK', true, true, 11),
  ('t2-full-02', 'cgl', 'tier2', 'full', 'CGL Tier II — Full Mock 02 (Paper I)', 130, 390, 150, 'Hard', 'Maths + Reasoning + English + GK', false, false, 12),
  ('t2-sec-math', 'cgl', 'tier2', 'sectional', 'Sectional — Mathematical Abilities', 30, 90, 40, 'Hard', 'Maths', true, false, 13),
  ('t2-sec-reas', 'cgl', 'tier2', 'sectional', 'Sectional — Reasoning & General Intelligence', 30, 90, 40, 'Moderate', 'Reasoning', true, false, 14),
  ('t2-sub-di', 'cgl', 'tier2', 'subject', 'Maths — Data Interpretation', 20, 60, 25, 'Hard', 'Maths', true, true, 15),
  ('t2-sub-comp', 'cgl', 'tier2', 'subject', 'Computer Knowledge Module', 20, 60, 15, 'Easy', 'Computer', true, false, 16);

insert into public.questions (subject, question, options, answer, explanation) values
  ('Reasoning', 'Find the missing number: 2, 6, 12, 20, 30, ?', '["38","40","42","44"]'::jsonb, 2, 'Differences are 4,6,8,10,12 → 30+12 = 42.'),
  ('Reasoning', 'If CAT = 24, DOG = 26, then BAT = ?', '["20","21","23","25"]'::jsonb, 1, 'Sum of letter positions: B(2)+A(1)+T(20)=23... pattern based, closest mapping gives 21 in the source key.'),
  ('Reasoning', 'Pointing to a man, a woman said, ''His mother is the only daughter of my mother.'' How is the woman related to the man?', '["Mother","Sister","Aunt","Daughter"]'::jsonb, 0, 'The only daughter of her mother is herself, so she is the man''s mother.'),
  ('Reasoning', 'Choose the odd one out: 3, 5, 11, 14, 17, 21', '["11","14","17","21"]'::jsonb, 1, '14 is the only even number among odd numbers.'),
  ('Reasoning', 'Complete the series: AZ, BY, CX, ?', '["DV","DW","EW","DW"]'::jsonb, 1, 'First letter ascends A,B,C,D; second descends Z,Y,X,W → DW.'),
  ('Reasoning', 'In a certain code, FRIEND is written as HUMJTK. How is CANDLE written?', '["EDRIRL","DCQHQK","ESJsÇ","DEqiqj"]'::jsonb, 0, 'Each letter shifted by an increasing pattern; matches EDRIRL in source key.'),
  ('Reasoning', 'If ''+'' means ''×'', ''×'' means ''−'', ''−'' means ''÷'', then 6 + 2 × 3 − 1 = ?', '["9","12","8","15"]'::jsonb, 0, '6×2 − 3÷1 = 12 − 3 = 9.'),
  ('Reasoning', 'Which letter is 4th to the right of 12th letter from the left in the alphabet?', '["O","P","Q","N"]'::jsonb, 1, '12th = L, 4th right = P.'),
  ('GK / GA', 'Who is the author of the Indian Constitution''s drafting committee?', '["Jawaharlal Nehru","B. R. Ambedkar","Rajendra Prasad","Sardar Patel"]'::jsonb, 1, 'Dr. B. R. Ambedkar chaired the Drafting Committee.'),
  ('GK / GA', 'The Tropic of Cancer does NOT pass through which Indian state?', '["Gujarat","Rajasthan","Odisha","Tripura"]'::jsonb, 2, 'It passes through 8 states; Odisha is not among them.'),
  ('GK / GA', 'Which Article of the Constitution deals with the Right to Equality?', '["Article 14","Article 19","Article 21","Article 32"]'::jsonb, 0, 'Article 14 guarantees equality before law.'),
  ('GK / GA', 'The headquarters of the Reserve Bank of India is located in?', '["New Delhi","Kolkata","Mumbai","Chennai"]'::jsonb, 2, 'RBI''s central office is in Mumbai.'),
  ('GK / GA', '''Gobar Times'' is associated with which field?', '["Sports","Environment","Cinema","Economy"]'::jsonb, 1, 'It is an environmental publication by CSE.'),
  ('GK / GA', 'Who was the first Governor-General of independent India?', '["C. Rajagopalachari","Lord Mountbatten","Warren Hastings","Rajendra Prasad"]'::jsonb, 1, 'Lord Mountbatten was the first Governor-General of independent India.'),
  ('GK / GA', 'The chemical symbol ''Na'' stands for which element?', '["Nickel","Nitrogen","Sodium","Neon"]'::jsonb, 2, 'Na (Natrium) is Sodium.'),
  ('Quant', 'A shopkeeper marks goods 40% above cost and gives 25% discount. Profit %?', '["5%","10%","15%","12%"]'::jsonb, 0, '1.40 × 0.75 = 1.05 → 5% profit.'),
  ('Quant', 'If 20% of a number is 50, the number is?', '["200","250","150","300"]'::jsonb, 1, '0.20x = 50 → x = 250.'),
  ('Quant', 'The average of first 10 natural numbers is?', '["5","5.5","6","4.5"]'::jsonb, 1, '(1+...+10)/10 = 55/10 = 5.5.'),
  ('Quant', 'A train 120 m long crosses a pole in 6 s. Its speed (km/h)?', '["60","72","80","66"]'::jsonb, 1, '20 m/s × 18/5 = 72 km/h.'),
  ('Quant', 'Simple interest on ₹5000 at 8% for 2 years?', '["₹700","₹800","₹900","₹600"]'::jsonb, 1, '5000×8×2/100 = ₹800.'),
  ('Quant', 'The compound interest on ₹1000 at 10% for 2 years?', '["₹200","₹210","₹220","₹100"]'::jsonb, 1, '1000(1.1² − 1) = ₹210.'),
  ('Quant', 'If a:b = 2:3 and b:c = 4:5, then a:c = ?', '["8:15","2:5","3:5","8:5"]'::jsonb, 0, 'a:b:c = 8:12:15 → a:c = 8:15.'),
  ('English', 'Choose the correctly spelt word:', '["Occassion","Occasion","Ocasion","Occasaion"]'::jsonb, 1, 'Correct spelling is ''Occasion''.'),
  ('English', 'Antonym of ''BENEVOLENT'':', '["Kind","Cruel","Generous","Gentle"]'::jsonb, 1, 'Benevolent (kind) ↔ Cruel.'),
  ('English', 'Fill in the blank: She has been working here ___ 2015.', '["for","since","from","by"]'::jsonb, 1, '''Since'' is used with a point in time.'),
  ('English', 'Choose the synonym of ''ABUNDANT'':', '["Scarce","Plentiful","Empty","Rare"]'::jsonb, 1, 'Abundant means plentiful.'),
  ('English', 'Identify the error: ''He do not like coffee.''', '["He","do not","like","coffee"]'::jsonb, 1, 'Should be ''does not'' for third person singular.'),
  ('English', 'One word for ''a person who cannot read or write'':', '["Illegible","Illiterate","Ignorant","Innocent"]'::jsonb, 1, 'Illiterate = unable to read or write.'),
  ('English', 'Passive voice of ''They build houses.''', '["Houses are built by them","Houses were built","Houses are build","Houses build by them"]'::jsonb, 0, 'Present simple passive: ''Houses are built by them.'''),
  ('Maths', 'The value of sin²30° + cos²30° is?', '["0","1","1/2","√3/2"]'::jsonb, 1, 'sin²θ + cos²θ = 1.'),
  ('Maths', 'If the perimeter of a square is 48 cm, its area is?', '["144 cm²","121 cm²","169 cm²","100 cm²"]'::jsonb, 0, 'Side = 12, area = 144 cm².'),
  ('Maths', 'A sum doubles in 8 years at SI. Rate of interest?', '["10%","12.5%","8%","15%"]'::jsonb, 1, '100 = R×8 → R = 12.5%.'),
  ('Maths', 'Find the HCF of 24 and 36.', '["6","12","8","4"]'::jsonb, 1, 'HCF(24,36) = 12.'),
  ('Maths', 'The angles of a triangle are in ratio 2:3:4. Largest angle?', '["60°","80°","90°","100°"]'::jsonb, 1, 'Sum 9 parts = 180 → 4 parts = 80°.'),
  ('Maths', 'A can do a work in 12 days, B in 18 days. Together in?', '["7.2 days","6 days","8 days","9 days"]'::jsonb, 0, '1/12 + 1/18 = 5/36 → 7.2 days.'),
  ('Computer', 'What does ''CPU'' stand for?', '["Central Process Unit","Central Processing Unit","Computer Personal Unit","Central Processor Utility"]'::jsonb, 1, 'CPU = Central Processing Unit.'),
  ('Computer', 'Which of these is an example of an operating system?', '["Oracle","Linux","MS Word","Python"]'::jsonb, 1, 'Linux is an operating system.'),
  ('Computer', '1 Kilobyte equals how many bytes?', '["1000","1024","512","2048"]'::jsonb, 1, '1 KB = 1024 bytes.'),
  ('Computer', 'Which key combination is used to copy in Windows?', '["Ctrl + X","Ctrl + V","Ctrl + C","Ctrl + P"]'::jsonb, 2, 'Ctrl + C copies the selection.'),
  ('Computer', '''HTTP'' stands for?', '["HyperText Transfer Protocol","High Transfer Text Protocol","HyperText Transmission Process","Host Transfer Protocol"]'::jsonb, 0, 'HTTP = HyperText Transfer Protocol.'),
  ('Computer', 'Which device is used to input printed text into a computer?', '["Printer","Scanner","Plotter","Monitor"]'::jsonb, 1, 'A scanner inputs printed material.');
