-- Generated SQL for job categories and subcategories from Excel data
-- Generated on: 2025-09-08T14:32:25.109Z

-- Insert job categories with Dutch and English translations
INSERT INTO public.job_categories (name, name_nl, name_en, description, description_nl, description_en, icon, created_at, updated_at) VALUES
('Business & consulting', 'Zakelijke dienstverlening & advies', 'Business & consulting', 'Professional services in business & consulting', 'Professionele diensten in zakelijke dienstverlening & advies', 'Professional services in business & consulting', 'briefcase', now(), now()),
('IT & data', 'IT & data', 'IT & data', 'Professional services in it & data', 'Professionele diensten in it & data', 'Professional services in it & data', 'code', now(), now()),
('Marketing & communications', 'Marketing & communicatie', 'Marketing & communications', 'Professional services in marketing & communications', 'Professionele diensten in marketing & communicatie', 'Professional services in marketing & communications', 'megaphone', now(), now()),
('Content & creation', 'Content & creatie', 'Content & creation', 'Professional services in content & creation', 'Professionele diensten in content & creatie', 'Professional services in content & creation', 'pen-tool', now(), now()),
('Design & UX', 'Design & UX', 'Design & UX', 'Professional services in design & ux', 'Professionele diensten in design & ux', 'Professional services in design & ux', 'palette', now(), now()),
('Construction & trades', 'Bouw & techniek', 'Construction & trades', 'Professional services in construction & trades', 'Professionele diensten in bouw & techniek', 'Professional services in construction & trades', 'hammer', now(), now()),
('Production & maintenance', 'Productie & onderhoud', 'Production & maintenance', 'Professional services in production & maintenance', 'Professionele diensten in productie & onderhoud', 'Professional services in production & maintenance', 'settings', now(), now()),
('Healthcare & wellness', 'Zorg & welzijn', 'Healthcare & wellness', 'Professional services in healthcare & wellness', 'Professionele diensten in zorg & welzijn', 'Professional services in healthcare & wellness', 'heart', now(), now()),
('Education & training', 'Onderwijs & training', 'Education & training', 'Professional services in education & training', 'Professionele diensten in onderwijs & training', 'Professional services in education & training', 'book-open', now(), now()),
('Hospitality & events', 'Horeca & evenementen', 'Hospitality & events', 'Professional services in hospitality & events', 'Professionele diensten in horeca & evenementen', 'Professional services in hospitality & events', 'calendar', now(), now()),
('Logistics & transportation', 'Logistiek & vervoer', 'Logistics & transportation', 'Professional services in logistics & transportation', 'Professionele diensten in logistiek & vervoer', 'Professional services in logistics & transportation', 'truck', now(), now()),
('Finance & legal', 'Financieel & juridisch', 'Finance & legal', 'Professional services in finance & legal', 'Professionele diensten in financieel & juridisch', 'Professional services in finance & legal', 'dollar-sign', now(), now()),
('Administrative support', 'Administratieve ondersteuning', 'Administrative support', 'Professional services in administrative support', 'Professionele diensten in administratieve ondersteuning', 'Professional services in administrative support', 'file-text', now(), now()),
('Sports & well-being', 'Sport & welzijn', 'Sports & well-being', 'Professional services in sports & well-being', 'Professionele diensten in sport & welzijn', 'Professional services in sports & well-being', 'activity', now(), now()),
('Sustainability & environment', 'Duurzaamheid & milieu', 'Sustainability & environment', 'Professional services in sustainability & environment', 'Professionele diensten in duurzaamheid & milieu', 'Professional services in sustainability & environment', 'leaf', now(), now())
ON CONFLICT (name) DO UPDATE SET
  name_nl = EXCLUDED.name_nl,
  name_en = EXCLUDED.name_en,
  description_nl = EXCLUDED.description_nl,
  description_en = EXCLUDED.description_en,
  updated_at = now();

-- Get category IDs for subcategory insertion
WITH category_mapping AS (
  SELECT 
    id,
    name_en,
    name_nl
  FROM public.job_categories
  WHERE name_en IN ('Business & consulting', 'IT & data', 'Marketing & communications', 'Content & creation', 'Design & UX', 'Construction & trades', 'Production & maintenance', 'Healthcare & wellness', 'Education & training', 'Hospitality & events', 'Logistics & transportation', 'Finance & legal', 'Administrative support', 'Sports & well-being', 'Sustainability & environment')
)

-- Insert job subcategories
INSERT INTO public.job_subcategories (category_id, name, name_nl, name_en, description, created_at, updated_at)
SELECT 
  cm.id,
  'Interim manager',
  'Interim-manager',
  'Interim manager',
  'Professional interim manager services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'Project manager',
  'Projectmanager',
  'Project manager',
  'Professional project manager services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'HR consultant',
  'HR-consultant',
  'HR consultant',
  'Professional hr consultant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'Management consultant',
  'Management consultant',
  'Management consultant',
  'Professional management consultant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'Business strategist',
  'Bedrijfsstrateeg',
  'Business strategist',
  'Professional business strategist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'Organizational consultant',
  'Organisatieadviseur',
  'Organizational consultant',
  'Professional organizational consultant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Business & consulting'

UNION ALL

SELECT 
  cm.id,
  'Software developer',
  'Software-developer',
  'Software developer',
  'Professional software developer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'Web/app developer',
  'Web-/app-ontwikkelaar',
  'Web/app developer',
  'Professional web/app developer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'AI/ML specialist',
  'AI-/ML-specialist',
  'AI/ML specialist',
  'Professional ai/ml specialist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'Data analyst',
  'Data-analist',
  'Data analyst',
  'Professional data analyst services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'Cloud engineer',
  'Cloud engineer',
  'Cloud engineer',
  'Professional cloud engineer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'Cybersecurity expert',
  'Cybersecurity-expert',
  'Cybersecurity expert',
  'Professional cybersecurity expert services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'IT & data'

UNION ALL

SELECT 
  cm.id,
  'Digital marketer',
  'Digital marketeer',
  'Digital marketer',
  'Professional digital marketer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'Social media manager',
  'Social-media-manager',
  'Social media manager',
  'Professional social media manager services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'SEO/SEA specialist',
  'SEO/SEA-specialist',
  'SEO/SEA specialist',
  'Professional seo/sea specialist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'Content marketer',
  'Contentmarketeer',
  'Content marketer',
  'Professional content marketer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'Email marketer',
  'E-mailmarketeer',
  'Email marketer',
  'Professional email marketer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'PR consultant',
  'PR-adviseur',
  'PR consultant',
  'Professional pr consultant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Marketing & communications'

UNION ALL

SELECT 
  cm.id,
  'Copywriter',
  'Copywriter',
  'Copywriter',
  'Professional copywriter services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Journalist',
  'Journalist',
  'Journalist',
  'Professional journalist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Translator',
  'Vertaler',
  'Translator',
  'Professional translator services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Photographer',
  'Fotograaf',
  'Photographer',
  'Professional photographer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Videographer',
  'Videograaf',
  'Videographer',
  'Professional videographer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Video editor',
  'Video-editor',
  'Video editor',
  'Professional video editor services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Podcast producer',
  'Podcast-producer',
  'Podcast producer',
  'Professional podcast producer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'Graphic designer',
  'Grafisch ontwerper',
  'Graphic designer',
  'Professional graphic designer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Content & creation'

UNION ALL

SELECT 
  cm.id,
  'UX/UI designer',
  'UX/UI-designer',
  'UX/UI designer',
  'Professional ux/ui designer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Design & UX'

UNION ALL

SELECT 
  cm.id,
  'Product designer',
  'Productdesigner',
  'Product designer',
  'Professional product designer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Design & UX'

UNION ALL

SELECT 
  cm.id,
  'Animator',
  'Animator',
  'Animator',
  'Professional animator services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Design & UX'

UNION ALL

SELECT 
  cm.id,
  'Illustration/3D artist',
  'Illustratie-/3D-kunstenaar',
  'Illustration/3D artist',
  'Professional illustration/3d artist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Design & UX'

UNION ALL

SELECT 
  cm.id,
  'Interior designer',
  'Interieurontwerper',
  'Interior designer',
  'Professional interior designer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Design & UX'

UNION ALL

SELECT 
  cm.id,
  'Carpenter',
  'Timmerman',
  'Carpenter',
  'Professional carpenter services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Electrician',
  'Elektricien',
  'Electrician',
  'Professional electrician services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Plumber',
  'Loodgieter',
  'Plumber',
  'Professional plumber services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Bricklayer',
  'Metselaar',
  'Bricklayer',
  'Professional bricklayer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Painter',
  'Schilder',
  'Painter',
  'Professional painter services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Roofer',
  'Dakdekker',
  'Roofer',
  'Professional roofer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Paver',
  'Stratenmaker',
  'Paver',
  'Professional paver services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Installer',
  'Installateur',
  'Installer',
  'Professional installer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Construction & trades'

UNION ALL

SELECT 
  cm.id,
  'Mechanic',
  'Monteur',
  'Mechanic',
  'Professional mechanic services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Boiler mechanic',
  'CV-monteur',
  'Boiler mechanic',
  'Professional boiler mechanic services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Solar panel installer',
  'Zonnepanelen-installateur',
  'Solar panel installer',
  'Professional solar panel installer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Handyman',
  'Klusjesman',
  'Handyman',
  'Professional handyman services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Gardener',
  'Tuinman',
  'Gardener',
  'Professional gardener services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Cleaner',
  'Schoonmaker',
  'Cleaner',
  'Professional cleaner services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Production & maintenance'

UNION ALL

SELECT 
  cm.id,
  'Nurse',
  'Verpleegkundige',
  'Nurse',
  'Professional nurse services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Healthcare & wellness'

UNION ALL

SELECT 
  cm.id,
  'Caregiver',
  'Verzorgende',
  'Caregiver',
  'Professional caregiver services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Healthcare & wellness'

UNION ALL

SELECT 
  cm.id,
  'Physiotherapist',
  'Fysiotherapeut',
  'Physiotherapist',
  'Professional physiotherapist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Healthcare & wellness'

UNION ALL

SELECT 
  cm.id,
  'Psychologist/coach',
  'Psycholoog/coach',
  'Psychologist/coach',
  'Professional psychologist/coach services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Healthcare & wellness'

UNION ALL

SELECT 
  cm.id,
  'Dental assistant',
  'Tandartsassistente',
  'Dental assistant',
  'Professional dental assistant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Healthcare & wellness'

UNION ALL

SELECT 
  cm.id,
  'Tutor',
  'Bijlesdocent',
  'Tutor',
  'Professional tutor services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'Language trainer',
  'Taaltrainer',
  'Language trainer',
  'Professional language trainer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'Exam coach',
  'Examencoach',
  'Exam coach',
  'Professional exam coach services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'E-learning developer',
  'E-learning-ontwikkelaar',
  'E-learning developer',
  'Professional e-learning developer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'Business trainer',
  'Zakelijk trainer',
  'Business trainer',
  'Professional business trainer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'Coach',
  'Coach',
  'Coach',
  'Professional coach services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Education & training'

UNION ALL

SELECT 
  cm.id,
  'Catering chef',
  'Cateringkok',
  'Catering chef',
  'Professional catering chef services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Barista',
  'Barista',
  'Barista',
  'Professional barista services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Bartender',
  'Barman',
  'Bartender',
  'Professional bartender services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Event planner',
  'Eventplanner',
  'Event planner',
  'Professional event planner services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Wedding planner',
  'Weddingplanner',
  'Wedding planner',
  'Professional wedding planner services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Host',
  'Gastvrouw/host',
  'Host',
  'Professional host services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Food truck operator',
  'Foodtruck-uitbater',
  'Food truck operator',
  'Professional food truck operator services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Hospitality & events'

UNION ALL

SELECT 
  cm.id,
  'Courier',
  'Koerier',
  'Courier',
  'Professional courier services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Logistics & transportation'

UNION ALL

SELECT 
  cm.id,
  'Moving service',
  'Verhuisservice',
  'Moving service',
  'Professional moving service services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Logistics & transportation'

UNION ALL

SELECT 
  cm.id,
  'Driver',
  'Chauffeur',
  'Driver',
  'Professional driver services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Logistics & transportation'

UNION ALL

SELECT 
  cm.id,
  'Bike delivery rider',
  'Fietsbezorger',
  'Bike delivery rider',
  'Professional bike delivery rider services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Logistics & transportation'

UNION ALL

SELECT 
  cm.id,
  'Logistics coordinator',
  'Logistiek coördinator',
  'Logistics coordinator',
  'Professional logistics coordinator services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Logistics & transportation'

UNION ALL

SELECT 
  cm.id,
  'Bookkeeper',
  'Boekhouder',
  'Bookkeeper',
  'Professional bookkeeper services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Tax advisor',
  'Belastingadviseur',
  'Tax advisor',
  'Professional tax advisor services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Financial planner',
  'Financieel planner',
  'Financial planner',
  'Professional financial planner services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Lawyer',
  'Jurist',
  'Lawyer',
  'Professional lawyer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Mediator',
  'Mediator',
  'Mediator',
  'Professional mediator services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Compliance expert',
  'Compliance-expert',
  'Compliance expert',
  'Professional compliance expert services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Finance & legal'

UNION ALL

SELECT 
  cm.id,
  'Virtual assistant',
  'Virtuele assistent',
  'Virtual assistant',
  'Professional virtual assistant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Administrative support'

UNION ALL

SELECT 
  cm.id,
  'Data-entry specialist',
  'Data-entry-specialist',
  'Data-entry specialist',
  'Professional data-entry specialist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Administrative support'

UNION ALL

SELECT 
  cm.id,
  'Customer service representative',
  'Klantenservice-medewerker',
  'Customer service representative',
  'Professional customer service representative services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Administrative support'

UNION ALL

SELECT 
  cm.id,
  'Secretary',
  'Secretaresse',
  'Secretary',
  'Professional secretary services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Administrative support'

UNION ALL

SELECT 
  cm.id,
  'Scheduler',
  'Planner',
  'Scheduler',
  'Professional scheduler services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Administrative support'

UNION ALL

SELECT 
  cm.id,
  'Personal trainer',
  'Personal trainer',
  'Personal trainer',
  'Professional personal trainer services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sports & well-being'

UNION ALL

SELECT 
  cm.id,
  'Yoga/fitness instructor',
  'Yoga-/fitness-instructeur',
  'Yoga/fitness instructor',
  'Professional yoga/fitness instructor services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sports & well-being'

UNION ALL

SELECT 
  cm.id,
  'Nutrition coach',
  'Voedingscoach',
  'Nutrition coach',
  'Professional nutrition coach services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sports & well-being'

UNION ALL

SELECT 
  cm.id,
  'Masseur',
  'Masseur',
  'Masseur',
  'Professional masseur services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sports & well-being'

UNION ALL

SELECT 
  cm.id,
  'Sports physiotherapist',
  'Sportfysiotherapeut',
  'Sports physiotherapist',
  'Professional sports physiotherapist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sports & well-being'

UNION ALL

SELECT 
  cm.id,
  'Energy advisor',
  'Energie-adviseur',
  'Energy advisor',
  'Professional energy advisor services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sustainability & environment'

UNION ALL

SELECT 
  cm.id,
  'Circular economy specialist',
  'Circulaire-economie-specialist',
  'Circular economy specialist',
  'Professional circular economy specialist services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sustainability & environment'

UNION ALL

SELECT 
  cm.id,
  'Environmental consultant',
  'Milieukundig consultant',
  'Environmental consultant',
  'Professional environmental consultant services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sustainability & environment'

UNION ALL

SELECT 
  cm.id,
  'Sustainability coach',
  'Duurzaamheidscoach',
  'Sustainability coach',
  'Professional sustainability coach services',
  now(),
  now()
FROM category_mapping cm WHERE cm.name_en = 'Sustainability & environment';