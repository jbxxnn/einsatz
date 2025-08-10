# DBA V2 Migration Implementation Plan

## 🎯 **Migration Strategy: Parallel System Approach**

We'll implement a **gradual, safe migration** that preserves all existing data while introducing the new system alongside the old one.

## 📋 **Step-by-Step Implementation**

### **Phase 1: Database Preparation (Safe)**
```bash
# 1. Run migration strategy (adds V2 schema alongside existing)
psql -h [host] -U postgres -d postgres -f db/migration-strategy.sql

# 2. Create new V2 tables
psql -h [host] -U postgres -d postgres -f db/dba-system-redesign.sql

# 3. Insert V2 questions
psql -h [host] -U postgres -d postgres -f db/insert-correct-dba-questions.sql
psql -h [host] -U postgres -d postgres -f db/insert-remaining-dba-questions.sql
```

**What this does:**
- ✅ Preserves ALL existing data
- ✅ Adds V2 schema alongside V1
- ✅ Creates feature flag system
- ✅ Adds migration tracking

### **Phase 2: API Enhancement**
Create feature flag system:

```typescript
// lib/feature-flags.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function isDBAV2Enabled(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    const { data } = await supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('flag_name', 'dba_v2_enabled')
      .single()
    
    return data?.is_enabled || false
  } catch {
    return false // Default to V1 if flag doesn't exist
  }
}
```

### **Phase 3: Component Integration**
Update booking form to use feature flag:

```typescript
// components/booking-form.tsx
import { isDBAV2Enabled } from '@/lib/feature-flags'
import DBAClientQuestionnaire from '@/components/dba-client-questionnaire' // V1
import DBAQuestionnaireV2 from '@/components/dba-questionnaire-v2' // V2

const renderDBAStep = async () => {
  const useV2 = await isDBAV2Enabled()
  
  return (
    <div className="space-y-4">
      {useV2 ? (
        // New V2 Component
        <DBAQuestionnaireV2
          userType="client"
          bookingId={bookingId}
          freelancerId={freelancer.id}
          clientId={clientId}
          onComplete={handleDBAComplete}
        />
      ) : (
        // Existing V1 Component
        <DBAClientQuestionnaire
          bookingId={bookingId}
          clientId={clientId}
          freelancerId={freelancer.id}
          onComplete={handleDBAComplete}
          onSave={handleDBASave}
        />
      )}
    </div>
  )
}
```

### **Phase 4: Report Generation**
Update report API to handle both versions:

```typescript
// app/api/dba/reports/generate/route.ts
import { isDBAV2Enabled } from '@/lib/feature-flags'

export async function POST(request: NextRequest) {
  const useV2 = await isDBAV2Enabled()
  
  if (useV2) {
    // Use new V2 algorithm
    return fetch('/api/dba/reports/generate-v2', {
      method: 'POST',
      body: request.body,
      headers: request.headers
    })
  } else {
    // Use existing V1 algorithm
    // ... existing V1 implementation
  }
}
```

## 🔄 **Rollout Plan**

### **Week 1: Infrastructure Setup**
```sql
-- Enable V2 for testing only (admin users)
UPDATE feature_flags 
SET is_enabled = true 
WHERE flag_name = 'dba_v2_enabled';
```

### **Week 2: Limited Beta**
```sql
-- Enable V2 for specific freelancers/clients
-- Add user-specific feature flags if needed
CREATE TABLE user_feature_flags (
  user_id UUID REFERENCES profiles(id),
  flag_name TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, flag_name)
);
```

### **Week 3: Gradual Rollout**
```sql
-- Enable V2 for percentage of users (using modulo)
-- Can be implemented in the feature flag logic
```

### **Week 4: Full Migration**
```sql
-- Enable V2 for all users
UPDATE feature_flags 
SET is_enabled = true 
WHERE flag_name = 'dba_v2_enabled';
```

## 📊 **Migration Monitoring**

### **Track Migration Progress:**
```sql
-- Check migration status
SELECT * FROM dba_migration_status;

-- Results example:
-- total_bookings | v1_reports | v2_reports | migration_percentage
-- 1000          | 750        | 250        | 25.00
```

### **Monitor Disputes:**
```sql
-- Check dispute patterns
SELECT 
  COUNT(*) as total_disputes,
  AVG(dispute_score) as avg_dispute_severity,
  resolution_status,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM dba_answer_disputes 
GROUP BY resolution_status;
```

## ⚠️ **Safety Measures**

### **Data Preservation:**
- ✅ **No data deletion** during migration
- ✅ **Parallel systems** running simultaneously  
- ✅ **Feature flag rollback** capability
- ✅ **Migration logging** for audit trail

### **Rollback Plan:**
```sql
-- Emergency rollback: Disable V2
UPDATE feature_flags 
SET is_enabled = false 
WHERE flag_name = 'dba_v2_enabled';

-- All users immediately revert to V1 system
```

### **Data Integrity Checks:**
```sql
-- Verify V2 data integrity
SELECT 
  COUNT(DISTINCT booking_id) as bookings_with_v2_reports,
  COUNT(*) as total_v2_reports,
  AVG(dispute_count) as avg_disputes_per_booking
FROM dba_reports 
WHERE methodology_version = 'v2_dutch_compliant';
```

## 🔧 **Implementation Commands**

### **Step 1: Database Setup**
```bash
# Connect to your database
psql -h db.abcdefghijklmnop.supabase.co -U postgres -d postgres

# Run migration scripts in order
\i db/migration-strategy.sql
\i db/dba-system-redesign.sql  
\i db/insert-correct-dba-questions.sql
\i db/insert-remaining-dba-questions.sql
```

### **Step 2: Feature Flag Control**
```sql
-- Start with V2 disabled (safe default)
INSERT INTO feature_flags (flag_name, is_enabled, description)
VALUES ('dba_v2_enabled', FALSE, 'Enable DBA V2 methodology')
ON CONFLICT (flag_name) DO NOTHING;

-- Enable for testing when ready
UPDATE feature_flags 
SET is_enabled = true 
WHERE flag_name = 'dba_v2_enabled';
```

### **Step 3: Monitor and Verify**
```sql
-- Check feature flag status
SELECT * FROM feature_flags WHERE flag_name = 'dba_v2_enabled';

-- Monitor migration progress
SELECT * FROM dba_migration_status;

-- Check for disputes (should be empty initially)
SELECT COUNT(*) FROM dba_answer_disputes;
```

## 🎯 **Success Criteria**

- ✅ V2 questions loaded successfully (35 questions)
- ✅ Feature flag system working
- ✅ Both V1 and V2 can generate reports
- ✅ Dispute detection working for "both" questions
- ✅ No data loss from V1 system
- ✅ Migration rollback tested and working

## 📞 **Next Steps**

1. **Review the migration scripts** before running
2. **Test in development environment** first
3. **Run Phase 1 (database setup)** when ready
4. **Implement feature flag logic** in your components
5. **Gradual rollout** with monitoring

Would you like me to help with any specific part of this implementation, or do you have questions about the migration strategy?