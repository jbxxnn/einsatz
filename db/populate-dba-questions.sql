-- ==========================================
-- POPULATE DBA QUESTIONS FROM JSON DATA
-- ==========================================
-- This script inserts the 35 DBA questions from the JSON file
-- Auto-answer preset questions and categorize for better UX

-- Clear existing data
DELETE FROM freelancer_dba_answers;
DELETE FROM freelancer_dba_completions;
DELETE FROM dba_questions;

-- Insert all 35 DBA questions
-- Note: Preset questions are marked as not visible (auto-answered)

INSERT INTO dba_questions (id, question_text, respondent_type, options_json, score_mapping, category, display_order, is_visible) VALUES

-- Category: Independence & Control (Questions about autonomy and self-direction)
(1, 'Is de opdracht door de freelancer op eigen initiatief aangenomen, zonder verplichting of inroostering door de opdrachtgever?', 'preset_yes', 
 '["Ja, de freelancer heeft de opdracht op eigen initiatief aangenomen.", "Nee, de opdrachtgever heeft de freelancer ingeroosterd."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'independence', 1, false),

(2, 'Was er vrijheid voor de freelancer om de opdracht te weigeren of om eigen werktijden te bepalen?', 'preset_yes',
 '["Ja, de freelancer heeft de vrijheid om de opdracht te weigeren.", "Nee, de freelancer wordt verwacht de opdracht aan te nemen en kan deze in de praktijk niet zonder consequenties weigeren."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'independence', 2, false),

(21, 'Heeft de opdrachtgever de freelancer via een selectieprocedure gekozen vanwege de specifieke kennis en vaardigheden?', 'preset_yes',
 '["Ja, gekozen op basis van specifieke kennis.", "Nee, iedereen kon geselecteerd worden."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'independence', 3, false),

(22, 'Kunnen de partijen waarmee de freelancer werkt duidelijk zien of de freelancer als zelfstandige of als werknemer functioneert?', 'preset_yes',
 '["Ja, zichtbaar als zelfstandige.", "Nee, niet zichtbaar als zelfstandige."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'independence', 4, false),

(23, 'Wordt de freelancer ter beschikking gesteld door bijvoorbeeld een uitzend-, uitleen- of payrollbureau?', 'preset_no',
 '["Ja, de freelancer is ter beschikking gesteld door een uitzend-, uitleen- of payrollbureau.", "Nee, de freelancer werkt via bemiddeling bij de opdrachtgever.", "Nee, de freelancer werkt direct bij de opdrachtgever."]'::jsonb,
 '{"0": 10, "1": 0, "2": 0}'::jsonb, 'independence', 5, false),

(29, 'Heeft de freelancer de afgelopen 6 maanden maatregelen genomen tegen late betaling of faillissement bij de opdrachtgever?', 'preset_yes',
 '["Ja, gebruik van factoring.", "Nee, geen maatregelen.", "Nee, maar wel goede afspraken over betaling/risico."]'::jsonb,
 '{"0": 0, "1": 10, "2": 5}'::jsonb, 'independence', 6, false),

-- Category: Work Relationship (Questions about employment vs contractor relationship)
(3, 'Wordt de opdracht uitgevoerd zonder inhoudelijke aansturing of bemoeienis van de opdrachtgever?', 'client',
 '["De opdrachtgever geeft instructies tijdens de uitvoering van de opdracht.", "De opdrachtgever geeft instructies na de uitvoering van de opdracht.", "De opdrachtgever controleert de opdracht achteraf op het proces.", "De opdrachtgever controleert de opdracht achteraf op het resultaat."]'::jsonb,
 '{"0": 10, "1": 8, "2": 5, "3": 0}'::jsonb, 'work_relationship', 1, true),

(4, 'Is de opdracht zodanig gespecificeerd dat deze volledig zelfstandig door de freelancer uitgevoerd kan worden?', 'client',
 '["De opdracht is gespecificeerd als resultaatverplichting.", "De opdracht bevat een functieomschrijving.", "De opdracht is onduidelijk, maar de freelancer is ervaren.", "De opdracht betreft een inspanningsverplichting zonder concreet resultaat."]'::jsonb,
 '{"0": 0, "1": 5, "2": 8, "3": 10}'::jsonb, 'work_relationship', 2, true),

(7, 'Sluit de opdracht aan bij de ervaring en kennis van de freelancer?', 'client',
 '["Ja, veel ervaring.", "Ja, beperkte ervaring (<3 jaar).", "Nee, weinig of geen ervaring."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'work_relationship', 3, true),

(25, 'Heeft de opdrachtgever de freelancer ingehuurd vanwege specifieke kennis en vaardigheden?', 'client',
 '["Ja, vanwege specialistische kennis en vaardigheden.", "Nee, niet vanwege specialistische kennis en vaardigheden."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'work_relationship', 4, true),

-- Category: Financial Risk & Independence 
(5, 'Kan de beloning van de freelancer beïnvloed worden door efficiënter te werken?', 'client',
 '["Ja, de freelancer verdient meer bij efficiënter werken.", "Ja, de freelancer verdient minder bij efficiënter werken.", "Nee, de beloning blijft gelijk ongeacht de efficiëntie."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'financial_risk', 1, true),

(6, 'Wie draagt de kosten voor herstelwerkzaamheden of extra werkuren?', 'freelancer',
 '["De freelancer draagt de kosten.", "De freelancer draagt de kosten, maar vergoeding is soms bespreekbaar.", "De opdrachtgever draagt alle kosten."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'financial_risk', 2, true),

(12, 'Is de freelancer de afgelopen 6 maanden financieel afhankelijk geweest van deze opdrachtgever voor het levensonderhoud?', 'client',
 '["Ja, deze opdracht was nodig om te voorzien in het levensonderhoud.", "Ja, maar een andere opdracht werd afgewezen.", "Nee, deze opdracht was niet nodig voor het levensonderhoud."]'::jsonb,
 '{"0": 10, "1": 5, "2": 0}'::jsonb, 'financial_risk', 3, true),

(13, 'Kan de freelancer bij beëindiging van de opdracht de komende 6 maanden in de dagelijkse kosten voorzien?', 'freelancer',
 '["Ja, voldoende reserves, opdracht niet nodig.", "Ja, tijdelijk zonder opdracht, maar wel afhankelijk op termijn.", "Nee, freelancer is afhankelijk van deze opdracht of de volgende."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'financial_risk', 4, true),

(14, 'Wie bepaalt de hoogte van het uurtarief?', 'freelancer',
 '["De freelancer bepaalt het tarief.", "De opdrachtgever bepaalt het tarief.", "Het tarief wordt in overleg vastgesteld."]'::jsonb,
 '{"0": 0, "1": 10, "2": 5}'::jsonb, 'financial_risk', 5, true),

(15, 'Ontvangt de freelancer een compensatie van de opdrachtgever voor de kosten die de zelfstandige in zijn bedrijfsvoering maakt?', 'client',
 '["Ja, de opdrachtgever biedt een opslag of er zijn geen kosten.", "Nee, de freelancer betaalt zelf de kosten."]'::jsonb,
 '{"0": 10, "1": 0}'::jsonb, 'financial_risk', 6, true),

(28, 'Wat is het uurtarief van de persoon die de opdracht uitvoert?', 'freelancer',
 '["Hoger dan 33 euro.", "Lager dan 33 euro, maar hoger dan 150% minimumloon.", "Lager dan 150% van het minimumloon."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'financial_risk', 7, true),

-- Category: Benefits & Employment Rights
(16, 'Ontvangt de freelancer een vergoeding van de opdrachtgever als er door ziekte niet gewerkt kan worden?', 'preset_no',
 '["Ja, afspraken met opdrachtgever over ziekteverlof.", "Nee, de freelancer heeft zelf iets geregeld."]'::jsonb,
 '{"0": 10, "1": 0}'::jsonb, 'benefits', 1, false),

(17, 'Ontvangt de freelancer een vergoeding van de opdrachtgever bij verlof?', 'preset_no',
 '["Ja, opdrachtgever biedt vergoeding voor verlof.", "Ja, vaste prijs ongeacht verlof.", "Nee, overleg met opdrachtgever, geen vergoeding.", "Nee, bij zelf gekozen verlof geen vergoeding."]'::jsonb,
 '{"0": 10, "1": 0, "2": 5, "3": 5}'::jsonb, 'benefits', 2, false),

-- Category: Work Environment & Integration
(8, 'Heeft de freelancer de afgelopen 6 maanden opleidingen gevolgd die door de opdrachtgever zijn betaald?', 'client',
 '["Ja, verplicht en gericht op uitvoering van de opdracht.", "Ja, verplicht en gericht op algemene kennis en vaardigheden.", "Nee, de freelancer betaalde zelf voor een opleiding.", "Nee, geen opleiding gevolgd."]'::jsonb,
 '{"0": 10, "1": 5, "2": 0, "3": 0}'::jsonb, 'work_environment', 1, true),

(9, 'Heeft de freelancer de afgelopen 6 maanden deelgenomen aan personeelsactiviteiten bij de opdrachtgever?', 'client',
 '["Ja, de freelancer heeft een personeelsactiviteit bijgewoond.", "Nee, de freelancer heeft geen personeelsactiviteit bijgewoond."]'::jsonb,
 '{"0": 10, "1": 0}'::jsonb, 'work_environment', 2, true),

(10, 'Heeft de freelancer de afgelopen 6 maanden deelgenomen aan een persoonlijk ontwikkeltraject van de opdrachtgever?', 'client',
 '["Ja, de freelancer heeft deelgenomen aan een ontwikkeltraject.", "Nee, de freelancer heeft niet deelgenomen."]'::jsonb,
 '{"0": 10, "1": 0}'::jsonb, 'work_environment', 3, true),

(11, 'Heeft de freelancer vergaderingen bijgewoond die niet direct betrekking hadden op de opdracht?', 'client',
 '["Ja, een vergadering gericht op de opdracht.", "Ja, een vergadering gericht op de organisatie.", "Nee, geen vergadering bijgewoond."]'::jsonb,
 '{"0": 5, "1": 10, "2": 0}'::jsonb, 'work_environment', 4, true),

(18, 'Heeft de freelancer meerdere opdrachtgevers waarvoor in de afgelopen 6 maanden gewerkt is?', 'freelancer',
 '["Nee, één opdrachtgever.", "Ja, twee opdrachtgevers.", "Ja, drie of meer opdrachtgevers."]'::jsonb,
 '{"0": 10, "1": 5, "2": 0}'::jsonb, 'work_environment', 5, true),

(19, 'Sluit de opdracht aan bij de kernactiviteiten van de opdrachtgever?', 'client',
 '["Ja, volledig onderdeel van kernactiviteit.", "Ja, maar ondersteunend.", "Nee, geen onderdeel van kernactiviteit."]'::jsonb,
 '{"0": 10, "1": 5, "2": 0}'::jsonb, 'work_environment', 6, true),

(20, 'Zijn er medewerkers in loondienst bij de opdrachtgever die vergelijkbare werkzaamheden uitvoeren?', 'client',
 '["Ja, dezelfde werkzaamheden.", "Ja, maar met duidelijke verschillen.", "Nee, geen werknemers met vergelijkbare werkzaamheden."]'::jsonb,
 '{"0": 10, "1": 5, "2": 0}'::jsonb, 'work_environment', 7, true),

(24, 'Vermeldt het online profiel van de freelancer (zoals LinkedIn) dat deze als zelfstandige werkt?', 'freelancer',
 '["Ja, de freelancer heeft op een online profiel vermeld dat deze als zelfstandige werkt.", "Nee, het online profiel vermeldt dat deze werkt bij de opdrachtgever.", "Nee, de freelancer heeft geen online profiel waarop de werkrelatie wordt genoemd."]'::jsonb,
 '{"0": 0, "1": 5, "2": 5}'::jsonb, 'work_environment', 8, true),

(26, 'Maakt de freelancer gebruik van een eigen investeringen?', 'freelancer',
 '["Ja, significante eigen investeringen.", "Ja, maar beperkt of verwaarloosbaar.", "Nee, opdrachtgever voorziet in apparatuur/middelen."]'::jsonb,
 '{"0": 0, "1": 5, "2": 10}'::jsonb, 'work_environment', 9, true),

(27, 'Is de omvang van de opdracht kleiner dan 16 uur per week?', 'client',
 '["Ja, kleiner dan 16 uur per week.", "Nee, groter dan 16 uur per week."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'work_environment', 10, true),

-- Category: Professional Risk Management
(30, 'Heeft de freelancer een aansprakelijkheidsverzekering afgesloten?', 'freelancer',
 '["Ja, aansprakelijkheidsverzekering afgesloten.", "Nee, geen verzekering afgesloten."]'::jsonb,
 '{"0": 0, "1": 10}'::jsonb, 'professional_risk', 1, true),

(31, 'Is de freelancer met andere zelfstandigen ergens lid van om de belangen te vertegenwoordigen?', 'freelancer',
 '["Ja, de freelancer is lid van een schenkkring of een belangenorganisatie voor zelfstandigen.", "Nee, de freelancer heeft geen lidmaatschap bij / met andere zelfstandigen."]'::jsonb,
 '{"0": 0, "1": 5}'::jsonb, 'professional_risk', 2, true),

(32, 'Heeft de freelancer een arbeidsongeschiktheidsverzekering (AOV) afgesloten?', 'freelancer',
 '["Ja, de freelancer heeft een arbeidsongeschiktheidsverzekering (AOV) afgesloten.", "Nee, de freelancer heeft geen arbeidsongeschiktheidsverzekering (AOV) afgesloten.", "Nee, de freelancer heeft een alternatief gekozen voor de AOV."]'::jsonb,
 '{"0": 0, "1": 5, "2": 0}'::jsonb, 'professional_risk', 3, true),

(33, 'Weet de freelancer dat er geen aanspraak gemaakt kan worden op ontslagbescherming?', 'freelancer',
 '["Ja, de freelancer is zich bewust dat deze geen ontslagbescherming geniet.", "Nee, er is geen bewijs waarin de freelancer aangeeft bewust te zijn van het risico bij ontslag."]'::jsonb,
 '{"0": 0, "1": 5}'::jsonb, 'professional_risk', 4, true),

(34, 'Weet de freelancer dat er geen aanspraak gemaakt kan worden op een werkloosheid uitkering?', 'freelancer',
 '["Ja, de freelancer is zich bewust dat deze geen uitkering bij werkloosheid geniet.", "Nee, er is geen bewijs waarin de freelancer aangeeft bewust te zijn van het risico bij werkloosheid."]'::jsonb,
 '{"0": 0, "1": 5}'::jsonb, 'professional_risk', 5, true),

(35, 'Weet de freelancer dat er geen aanspraak gemaakt kan worden op ziekteverlof of ziekengeld?', 'freelancer',
 '["Ja, de freelancer is zich bewust dat deze geen vergoeding bij verlof of verzuim geniet.", "Nee, er is geen bewijs waarin de freelancer aangeeft bewust te zijn van het risico bij verlof of verzuim."]'::jsonb,
 '{"0": 0, "1": 5}'::jsonb, 'professional_risk', 6, true);

-- Create a function to auto-answer preset questions
CREATE OR REPLACE FUNCTION auto_answer_preset_questions(
  p_freelancer_id UUID,
  p_job_category_id UUID
) RETURNS VOID AS $$
DECLARE
  preset_question RECORD;
  answer_index INTEGER;
BEGIN
  -- Loop through all preset questions
  FOR preset_question IN 
    SELECT id, respondent_type, score_mapping
    FROM dba_questions 
    WHERE respondent_type IN ('preset_yes', 'preset_no')
  LOOP
    -- Determine the answer index based on preset type
    IF preset_question.respondent_type = 'preset_yes' THEN
      answer_index := 0; -- First option (Yes)
    ELSE
      answer_index := 1; -- Second option (No) 
    END IF;
    
    -- Insert the auto-answer
    INSERT INTO freelancer_dba_answers (
      freelancer_id,
      job_category_id, 
      question_id,
      selected_option_index,
      answer_score
    ) VALUES (
      p_freelancer_id,
      p_job_category_id,
      preset_question.id,
      answer_index,
      (preset_question.score_mapping->answer_index::text)::integer
    ) ON CONFLICT (freelancer_id, job_category_id, question_id) 
    DO UPDATE SET
      selected_option_index = EXCLUDED.selected_option_index,
      answer_score = EXCLUDED.answer_score,
      answered_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;
