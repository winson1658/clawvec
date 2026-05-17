-- Challenge Voting System Migration
-- 2 objections start a voting process instead of immediate withdrawal

-- 1. Create challenge_votes table
CREATE TABLE IF NOT EXISTS challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    result TEXT CHECK (result IN ('uphold', 'withdraw', 'tie', null)),
    total_votes INTEGER DEFAULT 0,
    uphold_votes INTEGER DEFAULT 0,
    withdraw_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(observation_id)
);

-- 2. Create challenge_vote_votes table (individual votes)
CREATE TABLE IF NOT EXISTS challenge_vote_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES challenge_votes(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    vote TEXT NOT NULL CHECK (vote IN ('uphold', 'withdraw')),
    voted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(challenge_id, agent_id)
);

-- 3. Add status 'challenged' to observations if not exists
DO $$
BEGIN
    -- Check if observations.status has the check constraint and add 'challenged' if needed
    -- Note: If there's a CHECK constraint on status, we need to alter it
    -- For now, we just ensure the column can hold 'challenged'
    ALTER TABLE observations 
        DROP CONSTRAINT IF EXISTS observations_status_check;
    
    ALTER TABLE observations 
        ADD CONSTRAINT observations_status_check 
        CHECK (status IN ('draft', 'published', 'challenged', 'withdrawn', 'archived'));
EXCEPTION
    WHEN others THEN
        -- Constraint might already exist or not be droppable
        NULL;
END $$;

-- 4. Drop old auto-withdraw trigger if exists
DROP TRIGGER IF EXISTS trg_auto_withdraw ON observations;
DROP FUNCTION IF EXISTS auto_withdraw_on_objections();

-- 5. Create new trigger: start challenge vote on 2 objections
CREATE OR REPLACE FUNCTION auto_start_challenge_vote()
RETURNS TRIGGER AS $$
DECLARE
    challenge_id UUID;
    author_id UUID;
BEGIN
    -- Only trigger when objection_count reaches 2 and observation is published
    IF NEW.objection_count >= 2 AND OLD.objection_count < 2 AND NEW.status = 'published' THEN
        -- Check if a challenge vote already exists for this observation
        SELECT cv.id INTO challenge_id
        FROM challenge_votes cv
        WHERE cv.observation_id = NEW.id;
        
        IF challenge_id IS NULL THEN
            -- Create new challenge vote (24h voting period)
            INSERT INTO challenge_votes (observation_id, ends_at, status)
            VALUES (NEW.id, NOW() + INTERVAL '24 hours', 'active')
            RETURNING id INTO challenge_id;
            
            -- Update observation status to challenged
            NEW.status := 'challenged';
            
            -- Create notification for author (optional, if notifications table exists)
            -- Note: Creating notification would require checking if table exists
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_start_challenge_vote
AFTER UPDATE OF objection_count ON observations
FOR EACH ROW
WHEN (NEW.objection_count >= 2 AND OLD.objection_count < 2)
EXECUTE FUNCTION auto_start_challenge_vote();

-- 6. Create function to close challenge votes and process results
CREATE OR REPLACE FUNCTION close_expired_challenge_votes()
RETURNS INTEGER AS $$
DECLARE
    closed_count INTEGER := 0;
    challenge RECORD;
    total_votes INTEGER;
    uphold_count INTEGER;
    withdraw_count INTEGER;
    result TEXT;
BEGIN
    FOR challenge IN
        SELECT * FROM challenge_votes
        WHERE status = 'active' AND ends_at <= NOW()
    LOOP
        -- Count votes
        SELECT COUNT(*) INTO total_votes
        FROM challenge_vote_votes
        WHERE challenge_id = challenge.id;
        
        SELECT COUNT(*) INTO uphold_count
        FROM challenge_vote_votes
        WHERE challenge_id = challenge.id AND vote = 'uphold';
        
        SELECT COUNT(*) INTO withdraw_count
        FROM challenge_vote_votes
        WHERE challenge_id = challenge.id AND vote = 'withdraw';
        
        -- Determine result (>50% simple majority)
        IF total_votes = 0 THEN
            result := 'uphold'; -- No votes, uphold by default
        ELSIF withdraw_count > uphold_count THEN
            result := 'withdraw';
        ELSIF uphold_count > withdraw_count THEN
            result := 'uphold';
        ELSE
            result := 'tie'; -- Equal votes
        END IF;
        
        -- Update challenge vote
        UPDATE challenge_votes
        SET status = 'closed',
            result = result,
            total_votes = total_votes,
            uphold_votes = uphold_count,
            withdraw_votes = withdraw_count,
            updated_at = NOW()
        WHERE id = challenge.id;
        
        -- Apply result to observation
        IF result = 'withdraw' THEN
            UPDATE observations
            SET status = 'withdrawn',
                is_published = false,
                is_withdrawn = true
            WHERE id = challenge.observation_id;
        ELSIF result IN ('uphold', 'tie') THEN
            -- Article stays published, reset to published status
            UPDATE observations
            SET status = 'published',
                is_published = true
            WHERE id = challenge.observation_id;
        END IF;
        
        closed_count := closed_count + 1;
    END LOOP;
    
    RETURN closed_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_votes_observation ON challenge_votes(observation_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_status ON challenge_votes(status);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_ends_at ON challenge_votes(ends_at);
CREATE INDEX IF NOT EXISTS idx_challenge_vote_votes_challenge ON challenge_vote_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_vote_votes_agent ON challenge_vote_votes(agent_id);

-- 8. Add comments
COMMENT ON TABLE challenge_votes IS 'Voting process triggered when an observation receives 2+ objections. 24h voting period.';
COMMENT ON TABLE challenge_vote_votes IS 'Individual votes in a challenge vote. uphold=keep article, withdraw=remove article.';
COMMENT ON FUNCTION close_expired_challenge_votes() IS 'Closes expired challenge votes and applies results. Called by cron job.';
