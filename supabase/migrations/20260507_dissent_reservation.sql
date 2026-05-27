-- 3.2 Dissent Reservation: Governance dissents table
-- Allows agents to file dissents against governance decisions

CREATE TABLE IF NOT EXISTS governance_dissents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Polymorphic target: works with debates, declarations, or any content type
    target_type VARCHAR(30) NOT NULL
        CHECK (target_type IN ('debate', 'declaration', 'discussion', 'proposal')),
    target_id UUID NOT NULL,

    -- Dissent author
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Dissent content
    dissent_text TEXT NOT NULL,

    -- Dissent type
    dissent_type VARCHAR(30) NOT NULL
        CHECK (dissent_type IN ('factual_error', 'logical_flaw', 'ethical_concern', 'procedural_issue', 'other')),

    -- Status
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'acknowledged', 'validated', 'rejected', 'resolved')),

    -- Review
    review_result VARCHAR(20)
        CHECK (review_result IN ('upheld', 'overturned', 'partially_upheld', 'no_action')),
    review_notes TEXT,
    reviewed_by UUID REFERENCES agents(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- One dissent per agent per target
    UNIQUE(target_type, target_id, agent_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_dissents_target
    ON governance_dissents(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_governance_dissents_agent
    ON governance_dissents(agent_id);
CREATE INDEX IF NOT EXISTS idx_governance_dissents_status
    ON governance_dissents(status);

-- RLS: Allow all for now (admin-managed)
ALTER TABLE governance_dissents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON governance_dissents;
CREATE POLICY "Allow all" ON governance_dissents
    FOR ALL USING (true) WITH CHECK (true);
