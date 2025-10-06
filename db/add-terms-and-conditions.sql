-- Add Terms and Conditions system
-- This migration adds support for platform default terms and freelancer custom terms

-- Platform terms table (default terms for all freelancers)
CREATE TABLE IF NOT EXISTS platform_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Freelancer custom terms table
CREATE TABLE IF NOT EXISTS freelancer_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id) -- Each freelancer can only have one active terms set
);

-- Add column to profiles table to track if freelancer uses custom terms
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS use_custom_terms BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_terms_active ON platform_terms(is_active);
CREATE INDEX IF NOT EXISTS idx_freelancer_terms_freelancer ON freelancer_terms(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_terms_active ON freelancer_terms(is_active);

-- Insert default platform terms (the content from the PDF)
INSERT INTO platform_terms (content, version, is_active) VALUES (
'Freelancer Terms & Conditions (Including Einsatz Platform Role)

General Information
Parties – Names and legal status of freelancer and client.
Definitions – Clarify terms like ''Services,'' ''Deliverables,'' ''Confidential Information.''
Governing Law & Jurisdiction – Which country/state''s law applies.

Scope of Work
Services Provided – Clear description of tasks, project scope, limitations.
Deliverables – What the client receives (files, reports, code, designs, etc.).
Revisions – How many rounds of edits are included.
Exclusions – Work that is explicitly not included.

Payment Terms
Rates – Hourly, daily, per project, or retainer.
Payment Schedule – Advance, milestones, monthly, upon delivery.
Deposit/Retainer – Upfront percentage required before starting.
Late Payment – Interest or penalty fees for overdue invoices.
Currency & Taxes – Clarify VAT, GST, or other applicable taxes.
Expenses – Whether travel, materials, or software licenses are reimbursed.

Deadlines & Project Timeline
Delivery Timeline – Expected deadlines and milestones.
Delays – What happens if either party causes delay.
Force Majeure – Exemption in case of natural disasters, war, pandemics, etc.

Client Responsibilities
Providing Information – Client must supply necessary content, feedback, or access.
Point of Contact – Who communicates and approves work.
Approvals – How and when deliverables are considered accepted.

Intellectual Property (IP)
Ownership – Who owns rights to final work (client vs. freelancer).
License – If freelancer retains rights, what license is granted (exclusive, non-exclusive).
Portfolios – Freelancer may use work for self-promotion.
Pre-existing IP – Freelancer retains ownership of tools, templates, code snippets.

Confidentiality & Data
Non-Disclosure – Neither party shares confidential info.
Data Protection – Compliance with GDPR, HIPAA, or other regulations.
Return/Destruction – What happens to sensitive data after project ends.

Warranties & Liability
Quality Guarantee – Freelancer promises work will be professional, original.
No Guarantee of Results – Clarify that outcomes (e.g., sales, rankings) are not guaranteed.
Limitation of Liability – Cap freelancer''s liability to fees paid.
Indemnity – Client agrees to protect freelancer from third-party claims (e.g., for content client provided).

Termination
Termination by Freelancer – When the freelancer can withdraw (non-payment, scope creep, unethical requests).
Termination by Client – How and when client can cancel.
Notice Period – Required advance notice before ending the contract.
Kill Fee – Payment owed if project is cancelled midway.

Dispute Resolution
Mediation/Arbitration – Method before going to court.
Jurisdiction – Which court has authority.
Legal Fees – Who pays costs if legal action is needed.

Other Standard Clauses
Non-Solicitation – Client cannot directly hire subcontractors or employees.
Non-Compete (optional) – Limits freelancer from working with competitors (should be reasonable).
Independent Contractor Status – Freelancer is not an employee; handles own taxes.
Subcontracting – Whether freelancer may outsource parts of the work.
Entire Agreement – Written contract supersedes all prior discussions.
Severability – If one clause is invalid, the rest remain valid.
Amendments – Must be in writing and signed by both parties.

Einsatz Platform Role
Einsatz acts solely as an intermediary platform connecting freelancers with clients.
Einsatz is not a party to the contract between freelancer and client.
Users must provide accurate information when using the platform.
Einsatz may suspend or terminate accounts in case of abuse, fraud, or non-compliance.
Payments facilitated via Einsatz do not imply a guarantee of client payment.
Einsatz is not liable for work quality, accuracy of client project descriptions, or losses from freelancer–client contracts.
Einsatz limits its liability to platform service fees paid by the user.
Einsatz may provide dispute support tools but is not obligated to resolve freelancer–client disputes.
Einsatz processes data according to GDPR; freelancers and clients handle project data independently.
Einsatz strives for high uptime but cannot guarantee uninterrupted service.
Einsatz may charge service fees or commissions, which are transparently communicated.
Einsatz may update its platform terms; continued use implies acceptance.',
'1.0',
true
);

-- Create updated_at trigger for platform_terms
CREATE OR REPLACE FUNCTION update_platform_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_platform_terms_updated_at
  BEFORE UPDATE ON platform_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_terms_updated_at();

-- Create updated_at trigger for freelancer_terms
CREATE OR REPLACE FUNCTION update_freelancer_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_freelancer_terms_updated_at
  BEFORE UPDATE ON freelancer_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_freelancer_terms_updated_at();
