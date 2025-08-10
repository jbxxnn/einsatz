-- Insert Correct Dutch DBA Questions
-- Based on the official Dutch DBA methodology from docs/dba_questions_export.json

-- Clear existing questions (we'll migrate later if needed)
-- DELETE FROM dba_questions WHERE methodology_version != 'v2_dutch_compliant';

-- Insert the 35 correct Dutch DBA questions
INSERT INTO dba_question_groups (
  base_question_en, base_question_nl, category, weight, audience, 
  options_json, score_mapping, order_index
) VALUES

-- Question 1: Initiative to take the assignment
(
  'Was the assignment taken by the freelancer on their own initiative, without obligation or scheduling by the client?',
  'Is de opdracht door de freelancer op eigen initiatief aangenomen, zonder verplichting of inroostering door de opdrachtgever?',
  'control'::dba_category, 2, 'freelancer',
  '["Yes, the freelancer took the assignment on their own initiative", "No, the client scheduled/obligated the freelancer"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  1
),

-- Question 2: Freedom to refuse or set working hours
(
  'Was there freedom for the freelancer to refuse the assignment or to set their own working hours?',
  'Was er vrijheid voor de freelancer om de opdracht te weigeren of om eigen werktijden te bepalen?',
  'control'::dba_category, 2, 'freelancer',
  '["Yes, the freelancer has the freedom to refuse the assignment", "No, the freelancer is expected to accept and cannot refuse without consequences"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  2
),

-- Question 3: Content guidance during execution (CLIENT PERSPECTIVE)
(
  'Is the assignment executed without substantive guidance or interference from the client?',
  'Wordt de opdracht uitgevoerd zonder inhoudelijke aansturing of bemoeienis van de opdrachtgever?',
  'control'::dba_category, 3, 'client',
  '["The client gives instructions during execution", "The client gives instructions after execution", "The client checks the process afterwards", "The client checks the result afterwards"]'::jsonb,
  '{"0": 10, "1": 8, "2": 5, "3": 0}'::jsonb,
  3
),

-- Question 4: Specification level (BOTH PARTIES)
(
  'Is the assignment specified in such a way that it can be executed completely independently by the freelancer?',
  'Is de opdracht zodanig gespecificeerd dat deze volledig zelfstandig door de freelancer uitgevoerd kan worden?',
  'control'::dba_category, 2, 'both',
  '["The assignment is specified as a result obligation", "The assignment contains a job description", "The assignment is unclear but the freelancer is experienced", "The assignment is an effort obligation without concrete result"]'::jsonb,
  '{"0": 0, "1": 5, "2": 8, "3": 10}'::jsonb,
  4
),

-- Question 5: Payment efficiency influence
(
  'Can the freelancer''s payment be influenced by working more efficiently?',
  'Kan de beloning van de freelancer beïnvloed worden door efficiënter te werken?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Yes, the freelancer earns more with efficient work", "Yes, the freelancer earns less with efficient work", "No, payment remains the same regardless of efficiency"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  5
),

-- Question 6: Cost responsibility for repairs
(
  'Who bears the costs for repair work or extra working hours?',
  'Wie draagt de kosten voor herstelwerkzaamheden of extra werkuren?',
  'risk'::dba_category, 3, 'client',
  '["The freelancer bears the costs", "The freelancer bears the costs, but compensation is sometimes negotiable", "The client bears all costs"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  6
),

-- Question 7: Experience and knowledge match
(
  'Does the assignment match the freelancer''s experience and knowledge?',
  'Sluit de opdracht aan bij de ervaring en kennis van de freelancer?',
  'substitution'::dba_category, 2, 'freelancer',
  '["Yes, extensive experience", "Yes, limited experience (<3 years)", "No, little or no experience"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  7
),

-- Question 8: Client-paid training
(
  'Has the freelancer attended training in the past 6 months paid for by the client?',
  'Heeft de freelancer de afgelopen 6 maanden opleidingen gevolgd die door de opdrachtgever zijn betaald?',
  'control'::dba_category, 2, 'freelancer',
  '["Yes, mandatory and focused on assignment execution", "Yes, mandatory and focused on general knowledge and skills", "No, the freelancer paid for training themselves", "No, no training attended"]'::jsonb,
  '{"0": 10, "1": 5, "2": 0, "3": 0}'::jsonb,
  8
),

-- Question 9: Staff activities participation
(
  'Has the freelancer participated in staff activities at the client in the past 6 months?',
  'Heeft de freelancer de afgelopen 6 maanden deelgenomen aan personeelsactiviteiten bij de opdrachtgever?',
  'control'::dba_category, 1, 'freelancer',
  '["Yes, the freelancer attended a staff activity", "No, the freelancer did not attend staff activities"]'::jsonb,
  '{"0": 10, "1": 0}'::jsonb,
  9
),

-- Question 10: Personal development participation
(
  'Has the freelancer participated in personal development programs of the client in the past 6 months?',
  'Heeft de freelancer de afgelopen 6 maanden deelgenomen aan een persoonlijk ontwikkeltraject van de opdrachtgever?',
  'control'::dba_category, 1, 'freelancer',
  '["Yes, the freelancer participated in development programs", "No, the freelancer did not participate"]'::jsonb,
  '{"0": 10, "1": 0}'::jsonb,
  10
),

-- Question 11: Meeting participation
(
  'Has the freelancer attended meetings not directly related to the assignment?',
  'Heeft de freelancer vergaderingen bijgewoond die niet direct betrekking hadden op de opdracht?',
  'control'::dba_category, 1, 'freelancer',
  '["Yes, a meeting focused on the assignment", "Yes, a meeting focused on the organization", "No, no meetings attended"]'::jsonb,
  '{"0": 5, "1": 10, "2": 0}'::jsonb,
  11
),

-- Question 12: Financial dependency
(
  'Has the freelancer been financially dependent on this client for their livelihood in the past 6 months?',
  'Is de freelancer de afgelopen 6 maanden financieel afhankelijk geweest van deze opdrachtgever voor het levensonderhoud?',
  'economic_independence'::dba_category, 3, 'freelancer',
  '["Yes, this assignment was necessary for livelihood", "Yes, but another assignment was rejected", "No, this assignment was not necessary for livelihood"]'::jsonb,
  '{"0": 10, "1": 5, "2": 0}'::jsonb,
  12
),

-- Question 13: Financial reserves
(
  'Can the freelancer cover daily costs for the next 6 months if the assignment ends?',
  'Kan de freelancer bij beëindiging van de opdracht de komende 6 maanden in de dagelijkse kosten voorzien?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Yes, sufficient reserves, assignment not needed", "Yes, temporarily without assignment but dependent long-term", "No, freelancer is dependent on this or next assignment"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  13
),

-- Question 14: Rate determination (BOTH PARTIES)
(
  'Who determines the hourly rate?',
  'Wie bepaalt de hoogte van het uurtarief?',
  'economic_independence'::dba_category, 3, 'both',
  '["The freelancer determines the rate", "The client determines the rate", "The rate is set in consultation"]'::jsonb,
  '{"0": 0, "1": 10, "2": 5}'::jsonb,
  14
),

-- Continue with remaining questions...
-- I'll add more in the next batch to keep this manageable

-- Question 15: Business cost compensation
(
  'Does the freelancer receive compensation from the client for business operation costs?',
  'Ontvangt de freelancer een compensatie van de opdrachtgever voor de kosten die de zelfstandige in zijn bedrijfsvoering maakt?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Yes, the client offers a markup or there are no costs", "No, the freelancer pays the costs themselves"]'::jsonb,
  '{"0": 10, "1": 0}'::jsonb,
  15
);

-- Add remaining questions in subsequent inserts to avoid overwhelming the file
-- We'll continue with questions 16-35 in the next script

