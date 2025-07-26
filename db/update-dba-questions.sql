-- Update DBA Questions with Comprehensive Set
-- This script replaces the existing DBA questions with the comprehensive set
-- Run this AFTER the add-dba-system.sql file

-- Clear existing questions
DELETE FROM dba_questions;

-- Reset the sequence if using auto-increment (not needed for UUID)
-- ALTER SEQUENCE dba_questions_id_seq RESTART WITH 1;

-- Insert comprehensive DBA questions
INSERT INTO dba_questions (category, question_text_en, question_text_nl, question_type, is_freelancer_question, order_index, weight, is_required) VALUES

-- FREELANCER QUESTIONS

-- Control Category (Freelancer)
('control'::dba_category, 'Do you have the freedom to determine how to perform your work?', 'Heb je de vrijheid om te bepalen hoe je je werk uitvoert?', 'boolean', true, 1, 3, true),
('control'::dba_category, 'Can you set your own working hours?', 'Kun je je eigen werktijden bepalen?', 'boolean', true, 2, 2, true),
('control'::dba_category, 'Do you receive detailed instructions on how to perform your work?', 'Krijg je gedetailleerde instructies over hoe je je werk moet uitvoeren?', 'boolean', true, 3, 3, true),
('control'::dba_category, 'Are you supervised while performing your work?', 'Word je begeleid tijdens het uitvoeren van je werk?', 'boolean', true, 4, 2, true),
('control'::dba_category, 'Do you have to report to someone about your work progress?', 'Moet je aan iemand rapporteren over je werkvoortgang?', 'boolean', true, 5, 1, true),
('control'::dba_category, 'Can you choose your own work methods and techniques?', 'Kun je je eigen werkwijzen en technieken kiezen?', 'boolean', true, 6, 3, true),
('control'::dba_category, 'Do you have to follow specific procedures or protocols?', 'Moet je specifieke procedures of protocollen volgen?', 'boolean', true, 7, 2, true),
('control'::dba_category, 'Can you decide on the order of tasks to be performed?', 'Kun je beslissen over de volgorde van uit te voeren taken?', 'boolean', true, 8, 2, true),
('control'::dba_category, 'Do you have the authority to make decisions about your work?', 'Heb je de bevoegdheid om beslissingen te nemen over je werk?', 'boolean', true, 9, 3, true),
('control'::dba_category, 'Are you required to attend mandatory meetings or training?', 'Ben je verplicht om verplichte vergaderingen of trainingen bij te wonen?', 'boolean', true, 10, 1, true),

-- Substitution Category (Freelancer)
('substitution'::dba_category, 'Can you send someone else to do the work in your place?', 'Kun je iemand anders sturen om het werk in jouw plaats te doen?', 'boolean', true, 11, 3, true),
('substitution'::dba_category, 'Do you have the right to hire assistants?', 'Heb je het recht om assistenten in te huren?', 'boolean', true, 12, 3, true),
('substitution'::dba_category, 'Can you delegate work to others?', 'Kun je werk delegeren aan anderen?', 'boolean', true, 13, 2, true),
('substitution'::dba_category, 'Do you have to personally perform the work?', 'Moet je het werk persoonlijk uitvoeren?', 'boolean', true, 14, 3, true),
('substitution'::dba_category, 'Can you subcontract parts of the work?', 'Kun je delen van het werk uitbesteden?', 'boolean', true, 15, 3, true),

-- Tools Category (Freelancer)
('tools'::dba_category, 'Do you provide your own tools and equipment?', 'Stel je je eigen gereedschap en apparatuur beschikbaar?', 'boolean', true, 16, 2, true),
('tools'::dba_category, 'Do you use your own vehicle for work?', 'Gebruik je je eigen voertuig voor werk?', 'boolean', true, 17, 2, true),
('tools'::dba_category, 'Do you provide your own software and licenses?', 'Stel je je eigen software en licenties beschikbaar?', 'boolean', true, 18, 2, true),
('tools'::dba_category, 'Do you use your own office space or workspace?', 'Gebruik je je eigen kantoorruimte of werkplek?', 'boolean', true, 19, 2, true),
('tools'::dba_category, 'Do you provide your own safety equipment?', 'Stel je je eigen veiligheidsuitrusting beschikbaar?', 'boolean', true, 20, 1, true),
('tools'::dba_category, 'Do you use your own computer and peripherals?', 'Gebruik je je eigen computer en randapparatuur?', 'boolean', true, 21, 2, true),

-- Risk Category (Freelancer)
('risk'::dba_category, 'Do you bear financial risk for the work performed?', 'Loop je financieel risico voor het uitgevoerde werk?', 'boolean', true, 22, 3, true),
('risk'::dba_category, 'Do you have your own business insurance?', 'Heb je je eigen bedrijfsverzekering?', 'boolean', true, 23, 2, true),
('risk'::dba_category, 'Do you bear the risk of defective work?', 'Loop je het risico van gebrekkig werk?', 'boolean', true, 24, 3, true),
('risk'::dba_category, 'Do you have liability insurance?', 'Heb je aansprakelijkheidsverzekering?', 'boolean', true, 25, 2, true),
('risk'::dba_category, 'Do you bear the risk of delays or non-completion?', 'Loop je het risico van vertragingen of niet-voltooiing?', 'boolean', true, 26, 3, true),
('risk'::dba_category, 'Do you have to pay for your own mistakes?', 'Moet je betalen voor je eigen fouten?', 'boolean', true, 27, 3, true),

-- Economic Independence Category (Freelancer)
('economic_independence'::dba_category, 'Do you work for multiple clients?', 'Werk je voor meerdere opdrachtgevers?', 'boolean', true, 28, 3, true),
('economic_independence'::dba_category, 'Do you have your own business registration?', 'Heb je je eigen bedrijfsregistratie?', 'boolean', true, 29, 3, true),
('economic_independence'::dba_category, 'Do you have your own VAT number?', 'Heb je je eigen BTW-nummer?', 'boolean', true, 30, 2, true),
('economic_independence'::dba_category, 'Do you have your own business bank account?', 'Heb je je eigen zakelijke bankrekening?', 'boolean', true, 31, 2, true),
('economic_independence'::dba_category, 'Do you advertise your services?', 'Adverteer je je diensten?', 'boolean', true, 32, 2, true),
('economic_independence'::dba_category, 'Do you have your own website or business cards?', 'Heb je je eigen website of visitekaartjes?', 'boolean', true, 33, 1, true),
('economic_independence'::dba_category, 'Do you set your own rates?', 'Stel je je eigen tarieven vast?', 'boolean', true, 34, 3, true),
('economic_independence'::dba_category, 'Do you negotiate your own contracts?', 'Onderhandel je je eigen contracten?', 'boolean', true, 35, 3, true),
('economic_independence'::dba_category, 'Do you have other sources of income?', 'Heb je andere inkomstenbronnen?', 'boolean', true, 36, 2, true),
('economic_independence'::dba_category, 'Do you invest in your own business development?', 'Investeer je in je eigen bedrijfsontwikkeling?', 'boolean', true, 37, 2, true),

-- CLIENT QUESTIONS

-- Control Category (Client)
('control'::dba_category, 'Do you supervise the work being performed?', 'Begeleid je het werk dat wordt uitgevoerd?', 'boolean', false, 38, 3, true),
('control'::dba_category, 'Do you provide detailed instructions on how to perform the work?', 'Geef je gedetailleerde instructies over hoe het werk moet worden uitgevoerd?', 'boolean', false, 39, 3, true),
('control'::dba_category, 'Do you monitor the progress of the work?', 'Controleer je de voortgang van het werk?', 'boolean', false, 40, 2, true),
('control'::dba_category, 'Do you require regular progress reports?', 'Eis je regelmatige voortgangsrapporten?', 'boolean', false, 41, 2, true),
('control'::dba_category, 'Do you set specific deadlines for the work?', 'Stel je specifieke deadlines voor het werk?', 'boolean', false, 42, 2, true),
('control'::dba_category, 'Do you require the work to be done at your location?', 'Eis je dat het werk op jouw locatie wordt gedaan?', 'boolean', false, 43, 2, true),
('control'::dba_category, 'Do you provide training or guidance on work procedures?', 'Geef je training of begeleiding over werkprocedures?', 'boolean', false, 44, 2, true),
('control'::dba_category, 'Do you have the right to reject unsatisfactory work?', 'Heb je het recht om onbevredigend werk af te wijzen?', 'boolean', false, 45, 3, true),
('control'::dba_category, 'Do you require the worker to follow your company policies?', 'Eis je dat de werknemer je bedrijfsbeleid volgt?', 'boolean', false, 46, 2, true),
('control'::dba_category, 'Do you have the authority to change work assignments?', 'Heb je de bevoegdheid om werkopdrachten te wijzigen?', 'boolean', false, 47, 3, true),

-- Substitution Category (Client)
('substitution'::dba_category, 'Do you require the specific person to perform the work?', 'Eis je dat de specifieke persoon het werk uitvoert?', 'boolean', false, 48, 3, true),
('substitution'::dba_category, 'Do you have the right to reject substitutes?', 'Heb je het recht om vervangers af te wijzen?', 'boolean', false, 49, 2, true),
('substitution'::dba_category, 'Do you require approval for any substitutions?', 'Eis je goedkeuring voor eventuele vervangingen?', 'boolean', false, 50, 2, true),
('substitution'::dba_category, 'Do you have a say in who performs the work?', 'Heb je inspraak in wie het werk uitvoert?', 'boolean', false, 51, 2, true),
('substitution'::dba_category, 'Do you require the worker to be personally present?', 'Eis je dat de werknemer persoonlijk aanwezig is?', 'boolean', false, 52, 2, true),

-- Tools Category (Client)
('tools'::dba_category, 'Do you provide tools and equipment for the work?', 'Stel je gereedschap en apparatuur beschikbaar voor het werk?', 'boolean', false, 53, 2, true),
('tools'::dba_category, 'Do you provide workspace or office facilities?', 'Stel je werkruimte of kantoorfaciliteiten beschikbaar?', 'boolean', false, 54, 2, true),
('tools'::dba_category, 'Do you provide software and licenses?', 'Stel je software en licenties beschikbaar?', 'boolean', false, 55, 2, true),
('tools'::dba_category, 'Do you provide safety equipment?', 'Stel je veiligheidsuitrusting beschikbaar?', 'boolean', false, 56, 1, true),
('tools'::dba_category, 'Do you provide vehicles for work purposes?', 'Stel je voertuigen beschikbaar voor werkdoeleinden?', 'boolean', false, 57, 2, true),
('tools'::dba_category, 'Do you provide uniforms or work clothing?', 'Stel je uniformen of werkkleding beschikbaar?', 'boolean', false, 58, 1, true),

-- Risk Category (Client)
('risk'::dba_category, 'Do you bear the financial risk for the work outcome?', 'Loop je het financiële risico voor het werkresultaat?', 'boolean', false, 59, 3, true),
('risk'::dba_category, 'Do you have insurance that covers the work being performed?', 'Heb je verzekering die het uitgevoerde werk dekt?', 'boolean', false, 60, 2, true),
('risk'::dba_category, 'Do you bear the risk of project delays?', 'Loop je het risico van projectvertragingen?', 'boolean', false, 61, 2, true),
('risk'::dba_category, 'Do you bear the risk of quality issues?', 'Loop je het risico van kwaliteitsproblemen?', 'boolean', false, 62, 3, true),
('risk'::dba_category, 'Do you have to pay for rework if the work is unsatisfactory?', 'Moet je betalen voor herwerk als het werk onbevredigend is?', 'boolean', false, 63, 3, true),
('risk'::dba_category, 'Do you bear the risk of legal liability for the work?', 'Loop je het risico van juridische aansprakelijkheid voor het werk?', 'boolean', false, 64, 3, true),

-- Economic Independence Category (Client)
('economic_independence'::dba_category, 'Is this work core to your business operations?', 'Is dit werk kern van je bedrijfsactiviteiten?', 'boolean', false, 65, 3, true),
('economic_independence'::dba_category, 'Do you have a long-term relationship with this worker?', 'Heb je een langdurige relatie met deze werknemer?', 'boolean', false, 66, 2, true),
('economic_independence'::dba_category, 'Is this worker integrated into your organization?', 'Is deze werknemer geïntegreerd in je organisatie?', 'boolean', false, 67, 3, true),
('economic_independence'::dba_category, 'Do you provide benefits similar to employees?', 'Bied je voordelen vergelijkbaar met werknemers?', 'boolean', false, 68, 2, true),
('economic_independence'::dba_category, 'Do you have exclusive rights to this worker''s services?', 'Heb je exclusieve rechten op de diensten van deze werknemer?', 'boolean', false, 69, 2, true),
('economic_independence'::dba_category, 'Is this work essential for your business continuity?', 'Is dit werk essentieel voor je bedrijfscontinuïteit?', 'boolean', false, 70, 3, true),
('economic_independence'::dba_category, 'Do you provide regular work assignments?', 'Geef je regelmatige werkopdrachten?', 'boolean', false, 71, 2, true),
('economic_independence'::dba_category, 'Do you have control over the worker''s other clients?', 'Heb je controle over de andere klanten van de werknemer?', 'boolean', false, 72, 2, true),
('economic_independence'::dba_category, 'Is this worker part of your business strategy?', 'Is deze werknemer onderdeel van je bedrijfsstrategie?', 'boolean', false, 73, 2, true),
('economic_independence'::dba_category, 'Do you invest in this worker''s development?', 'Investeer je in de ontwikkeling van deze werknemer?', 'boolean', false, 74, 2, true);

-- Log the update (only if system user exists, otherwise skip)
DO $$
BEGIN
  INSERT INTO dba_audit_logs (user_id, action, details, created_at)
  SELECT 
    id,
    'questions_updated',
    '{"total_questions": 74, "freelancer_questions": 37, "client_questions": 37, "categories": ["control", "substitution", "tools", "risk", "economic_independence"]}'::jsonb,
    NOW()
  FROM profiles 
  WHERE email = 'system@einsatz.com' 
  LIMIT 1;
  
  -- If no system user found, just continue without logging
  IF NOT FOUND THEN
    RAISE NOTICE 'System user not found, skipping audit log entry';
  END IF;
END $$; 