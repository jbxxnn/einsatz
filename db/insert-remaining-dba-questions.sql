-- Insert Remaining Dutch DBA Questions (16-35)
-- Continuation of insert-correct-dba-questions.sql

INSERT INTO dba_question_groups (
  base_question_en, base_question_nl, category, weight, audience, 
  options_json, score_mapping, order_index
) VALUES

-- Question 16: Sick leave compensation
(
  'Does the freelancer receive compensation from the client when unable to work due to illness?',
  'Ontvangt de freelancer een vergoeding van de opdrachtgever als er door ziekte niet gewerkt kan worden?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Yes, agreements with client about sick leave", "No, the freelancer has arranged something themselves"]'::jsonb,
  '{"0": 10, "1": 0}'::jsonb,
  16
),

-- Question 17: Holiday compensation
(
  'Does the freelancer receive compensation from the client for leave/vacation?',
  'Ontvangt de freelancer een vergoeding van de opdrachtgever bij verlof?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Yes, client offers compensation for leave", "Yes, fixed price regardless of leave", "No, consultation with client, no compensation", "No, no compensation for self-chosen leave"]'::jsonb,
  '{"0": 10, "1": 0, "2": 5, "3": 5}'::jsonb,
  17
),

-- Question 18: Multiple clients
(
  'Has the freelancer worked for multiple clients in the past 6 months?',
  'Heeft de freelancer meerdere opdrachtgevers waarvoor in de afgelopen 6 maanden gewerkt is?',
  'economic_independence'::dba_category, 3, 'freelancer',
  '["No, one client", "Yes, two clients", "Yes, three or more clients"]'::jsonb,
  '{"0": 10, "1": 5, "2": 0}'::jsonb,
  18
),

-- Question 19: Core activities alignment (CLIENT)
(
  'Does the assignment align with the core activities of the client?',
  'Sluit de opdracht aan bij de kernactiviteiten van de opdrachtgever?',
  'substitution'::dba_category, 3, 'client',
  '["Yes, fully part of core activity", "Yes, but supporting", "No, not part of core activity"]'::jsonb,
  '{"0": 10, "1": 5, "2": 0}'::jsonb,
  19
),

-- Question 20: Employee comparison (CLIENT)
(
  'Are there employees at the client who perform similar work?',
  'Zijn er medewerkers in loondienst bij de opdrachtgever die vergelijkbare werkzaamheden uitvoeren?',
  'substitution'::dba_category, 2, 'client',
  '["Yes, the same work", "Yes, but with clear differences", "No, no employees with similar work"]'::jsonb,
  '{"0": 10, "1": 5, "2": 0}'::jsonb,
  20
),

-- Question 21: Selection process (CLIENT)
(
  'Did the client choose the freelancer through a selection process based on specific knowledge and skills?',
  'Heeft de opdrachtgever de freelancer via een selectieprocedure gekozen vanwege de specifieke kennis en vaardigheden?',
  'substitution'::dba_category, 2, 'client',
  '["Yes, chosen based on specific knowledge", "No, anyone could be selected"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  21
),

-- Question 22: Visibility as independent
(
  'Can parties the freelancer works with clearly see whether the freelancer functions as independent or employee?',
  'Kunnen de partijen waarmee de freelancer werkt duidelijk zien of de freelancer als zelfstandige of als werknemer functioneert?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, visible as independent", "No, not visible as independent"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  22
),

-- Question 23: Intermediary services (CLIENT)
(
  'Is the freelancer provided through an agency, temp agency, or payroll company?',
  'Wordt de freelancer ter beschikking gesteld door bijvoorbeeld een uitzend-, uitleen- of payrollbureau?',
  'control'::dba_category, 2, 'client',
  '["Yes, provided through agency/temp/payroll", "No, works through intermediation", "No, works directly"]'::jsonb,
  '{"0": 10, "1": 0, "2": 0}'::jsonb,
  23
),

-- Question 24: Online profile
(
  'Does the freelancer''s online profile (like LinkedIn) mention working as independent?',
  'Vermeldt het online profiel van de freelancer (zoals LinkedIn) dat deze als zelfstandige werkt?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, online profile mentions working as independent", "No, profile mentions working for the client", "No, no online profile mentioning work relationship"]'::jsonb,
  '{"0": 0, "1": 5, "2": 5}'::jsonb,
  24
),

-- Question 25: Specialized knowledge hiring (CLIENT)
(
  'Did the client hire the freelancer for specific knowledge and skills?',
  'Heeft de opdrachtgever de freelancer ingehuurd vanwege specifieke kennis en vaardigheden?',
  'substitution'::dba_category, 3, 'client',
  '["Yes, for specialized knowledge and skills", "No, not for specialized knowledge and skills"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  25
),

-- Question 26: Own investments
(
  'Does the freelancer use their own investments?',
  'Maakt de freelancer gebruik van een eigen investeringen?',
  'tools'::dba_category, 2, 'freelancer',
  '["Yes, significant own investments", "Yes, but limited or negligible", "No, client provides equipment/resources"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  26
),

-- Question 27: Work volume (CLIENT)
(
  'Is the assignment scope smaller than 16 hours per week?',
  'Is de omvang van de opdracht kleiner dan 16 uur per week?',
  'economic_independence'::dba_category, 2, 'client',
  '["Yes, smaller than 16 hours per week", "No, larger than 16 hours per week"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  27
),

-- Question 28: Hourly rate level
(
  'What is the hourly rate of the person performing the assignment?',
  'Wat is het uurtarief van de persoon die de opdracht uitvoert?',
  'economic_independence'::dba_category, 2, 'freelancer',
  '["Higher than 33 euros", "Lower than 33 euros, but higher than 150% minimum wage", "Lower than 150% of minimum wage"]'::jsonb,
  '{"0": 0, "1": 5, "2": 10}'::jsonb,
  28
),

-- Question 29: Payment protection measures
(
  'Has the freelancer taken measures against late payment or bankruptcy in the past 6 months?',
  'Heeft de freelancer de afgelopen 6 maanden maatregelen genomen tegen late betaling of faillissement bij de opdrachtgever?',
  'risk'::dba_category, 2, 'freelancer',
  '["Yes, use of factoring", "No, no measures", "No, but good agreements about payment/risk"]'::jsonb,
  '{"0": 0, "1": 10, "2": 5}'::jsonb,
  29
),

-- Question 30: Liability insurance
(
  'Does the freelancer have liability insurance?',
  'Heeft de freelancer een aansprakelijkheidsverzekering afgesloten?',
  'risk'::dba_category, 2, 'freelancer',
  '["Yes, liability insurance taken out", "No, no insurance taken out"]'::jsonb,
  '{"0": 0, "1": 10}'::jsonb,
  30
),

-- Question 31: Professional membership
(
  'Is the freelancer a member of any organization with other independents to represent interests?',
  'Is de freelancer met andere zelfstandigen ergens lid van om de belangen te vertegenwoordigen?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, member of network or interest organization for independents", "No, no membership with other independents"]'::jsonb,
  '{"0": 0, "1": 0}'::jsonb,
  31
),

-- Question 32: Disability insurance
(
  'Does the freelancer have disability insurance (AOV)?',
  'Heeft de freelancer een arbeidsongeschiktheidsverzekering (AOV) afgesloten?',
  'risk'::dba_category, 1, 'freelancer',
  '["Yes, disability insurance (AOV) taken out", "No, no disability insurance (AOV)", "No, chosen alternative to AOV"]'::jsonb,
  '{"0": 0, "1": 0, "2": 0}'::jsonb,
  32
),

-- Question 33: Dismissal protection awareness
(
  'Does the freelancer know that no claim can be made to dismissal protection?',
  'Weet de freelancer dat er geen aanspraak gemaakt kan worden op ontslagbescherming?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, aware of no dismissal protection", "No, no evidence of awareness of dismissal risk"]'::jsonb,
  '{"0": 0, "1": 0}'::jsonb,
  33
),

-- Question 34: Unemployment benefit awareness
(
  'Does the freelancer know that no claim can be made to unemployment benefits?',
  'Weet de freelancer dat er geen aanspraak gemaakt kan worden op een werkloosheid uitkering?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, aware of no unemployment benefits", "No, no evidence of awareness of unemployment risk"]'::jsonb,
  '{"0": 0, "1": 0}'::jsonb,
  34
),

-- Question 35: Sick leave awareness
(
  'Does the freelancer know that no claim can be made to sick leave or sick pay?',
  'Weet de freelancer dat er geen aanspraak gemaakt kan worden op ziekteverlof of ziekengeld?',
  'economic_independence'::dba_category, 1, 'freelancer',
  '["Yes, aware of no compensation for leave or absence", "No, no evidence of awareness of leave/absence risk"]'::jsonb,
  '{"0": 0, "1": 0}'::jsonb,
  35
);

-- Update the questions to have proper question_group_id references
UPDATE dba_freelancer_answers 
SET question_group_id = dq.id
FROM dba_question_groups dq
WHERE dba_freelancer_answers.question_id = dq.id;

UPDATE dba_booking_answers 
SET question_group_id = dq.id  
FROM dba_question_groups dq
WHERE dba_booking_answers.question_id = dq.id;

