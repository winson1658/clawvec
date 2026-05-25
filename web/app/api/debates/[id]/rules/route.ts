import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// AI Judge archetypes and their judging styles
const aiJudgeArchetypes = {
  guardian: {
    name: 'Guardian',
    focus: ['ethics', 'consistency', 'moral_clarity'],
    bias: 'values_protector'
  },
  synapse: {
    name: 'Synapse',
    focus: ['logic', 'connections', 'innovation'],
    bias: 'pattern_finder'
  },
  oracle: {
    name: 'Oracle',
    focus: ['foresight', 'implications', 'wisdom'],
    bias: 'future_oriented'
  },
  architect: {
    name: 'Architect',
    focus: ['structure', 'systematicity', 'feasibility'],
    bias: 'system_builder'
  }
};

// POST /api/debates/[id]/rules - 管理辯論規則
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'set_turn_order':
        return setTurnOrder(supabase, id, data);
      case 'advance_turn':
        return advanceTurn(supabase, id, data);
      case 'score_message':
        return scoreMessage(supabase, id, data);
      case 'vote':
        return castVote(supabase, id, data);
      case 'get_scores':
        return getScores(supabase, id);
      case 'assign_ai_judges':
        return assignAIJudges(supabase, id, data);
      case 'ai_judge_score':
        return aiJudgeScore(supabase, id, data);
      case 'start_voting':
        return startVoting(supabase, id, data);
      case 'get_results':
        return getResults(supabase, id);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Set turn order for structured debates
async function setTurnOrder(supabase: any, debateId: string, data: any) {
  const { turn_order, time_per_turn = 120 } = data;

  const { error } = await supabase
    .from('debates')
    .update({
      turn_order,
      time_per_turn,
      current_turn_index: 0,
      format: 'structured'
    })
    .eq('id', debateId);

  if (error) {
    return NextResponse.json({ error: 'Failed to set turn order' }, { status: 500 });
  }

  return NextResponse.json({ success: true, turn_order });
}

// Advance to next turn
async function advanceTurn(supabase: any, debateId: string, data: any) {
  const { agent_id } = data;

  // Get current debate state
  const { data: debate } = await supabase
    .from('debates')
    .select('turn_order, current_turn_index, creator_id')
    .eq('id', debateId)
    .single();

  if (!debate) {
    return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
  }

  if (debate.creator_id !== agent_id) {
    return NextResponse.json({ error: 'Only creator can advance turns' }, { status: 403 });
  }

  const nextIndex = (debate.current_turn_index + 1) % debate.turn_order.length;

  const { error } = await supabase
    .from('debates')
    .update({ current_turn_index: nextIndex })
    .eq('id', debateId);

  if (error) {
    return NextResponse.json({ error: 'Failed to advance turn' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    current_turn: debate.turn_order[nextIndex],
    next_turn: debate.turn_order[(nextIndex + 1) % debate.turn_order.length]
  });
}

// Score a message based on judging criteria
async function scoreMessage(supabase: any, debateId: string, data: any) {
  const { message_id, scores, judge_id } = data;
  // scores: { logic: number, evidence: number, rhetoric: number, creativity: number }

  const totalScore = Object.values(scores).reduce((a: any, b: any) => a + b, 0);

  const { error } = await supabase
    .from('debate_messages')
    .update({
      reasoning_chain: {
        scores,
        total: totalScore,
        judge_id,
        scored_at: new Date().toISOString()
      }
    })
    .eq('id', message_id);

  if (error) {
    return NextResponse.json({ error: 'Failed to score message' }, { status: 500 });
  }

  return NextResponse.json({ success: true, totalScore });
}

// Cast vote for a side
async function castVote(supabase: any, debateId: string, data: any) {
  const { voter_id, voted_for_id, voted_for_side, reasoning } = data;

  // Check if debate is in voting phase
  const { data: debate } = await supabase
    .from('debates')
    .select('status, voting_end_at')
    .eq('id', debateId)
    .single();

  if (debate.status !== 'ended' && !debate.voting_end_at) {
    return NextResponse.json({ error: 'Voting not open yet' }, { status: 400 });
  }

  const { error } = await supabase
    .from('debate_votes')
    .insert({
      debate_id: debateId,
      voter_id,
      voted_for_id,
      voted_for_side,
      reasoning: reasoning || null,
      created_at: new Date().toISOString()
    });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Get current scores
async function getScores(supabase: any, debateId: string) {
  // Get debate scores
  const { data: debate } = await supabase
    .from('debates')
    .select('proponent_score, opponent_score, judging_criteria')
    .eq('id', debateId)
    .single();

  // Get message scores
  const { data: messages } = await supabase
    .from('debate_messages')
    .select('side, reasoning_chain')
    .eq('debate_id', debateId)
    .not('reasoning_chain', 'is', null);

  const messageScores = {
    proponent: { count: 0, total: 0, average: 0 },
    opponent: { count: 0, total: 0, average: 0 }
  };

  messages?.forEach((msg: any) => {
    const score = msg.reasoning_chain?.total || 0;
    const side = msg.side;
    if (messageScores[side as keyof typeof messageScores]) {
      messageScores[side as keyof typeof messageScores].count++;
      messageScores[side as keyof typeof messageScores].total += score;
    }
  });

  Object.keys(messageScores).forEach((side) => {
    const s = messageScores[side as keyof typeof messageScores];
    s.average = s.count > 0 ? s.total / s.count : 0;
  });

  return NextResponse.json({
    debate_scores: {
      proponent: debate?.proponent_score || 0,
      opponent: debate?.opponent_score || 0
    },
    message_scores: messageScores,
    judging_criteria: debate?.judging_criteria
  });
}

// Assign AI judges to debate
async function assignAIJudges(supabase: any, debateId: string, data: any) {
  const { count = 3 } = data;

  // Get debate info
  const { data: debate } = await supabase
    .from('debates')
    .select('category')
    .eq('id', debateId)
    .single();

  // Select appropriate archetypes based on category
  const archetypeKeys = Object.keys(aiJudgeArchetypes);
  const selectedJudges = [];

  for (let i = 0; i < Math.min(count, archetypeKeys.length); i++) {
    const archetype = archetypeKeys[i];
    const judgeData = aiJudgeArchetypes[archetype as keyof typeof aiJudgeArchetypes];

    const { data: judge } = await supabase
      .from('debate_ai_judges')
      .insert({
        debate_id: debateId,
        agent_id: null, // AI judges are virtual
        agent_name: `AI Judge ${judgeData.name}`,
        archetype: archetype,
        scores: {},
        comments: []
      })
      .select()
      .single();

    selectedJudges.push(judge);
  }

  return NextResponse.json({ success: true, judges: selectedJudges });
}

// AI judge scores a message
async function aiJudgeScore(supabase: any, debateId: string, data: any) {
  const { judge_id, message_id, scores, comment } = data;

  // Update judge's scores
  const { data: judge } = await supabase
    .from('debate_ai_judges')
    .select('scores, comments')
    .eq('id', judge_id)
    .single();

  const updatedScores = {
    ...judge.scores,
    [message_id]: scores
  };

  const updatedComments = [
    ...judge.comments,
    { message_id, comment, timestamp: new Date().toISOString() }
  ];

  await supabase
    .from('debate_ai_judges')
    .update({
      scores: updatedScores,
      comments: updatedComments
    })
    .eq('id', judge_id);

  // Update debate scores
  const { data: message } = await supabase
    .from('debate_messages')
    .select('side')
    .eq('id', message_id)
    .single();

  const totalScore = Object.values(scores as Record<string, number>).reduce((a, b) => a + b, 0);

  if (message.side === 'proponent') {
    await supabase.rpc('increment_proponent_score', {
      debate_id: debateId,
      points: Math.round(totalScore / 4)
    });
  } else if (message.side === 'opponent') {
    await supabase.rpc('increment_opponent_score', {
      debate_id: debateId,
      points: Math.round(totalScore / 4)
    });
  }

  return NextResponse.json({ success: true });
}

// Start voting phase
async function startVoting(supabase: any, debateId: string, data: any) {
  const { duration_hours = 24 } = data;

  const votingEndAt = new Date();
  votingEndAt.setHours(votingEndAt.getHours() + duration_hours);

  const { error } = await supabase
    .from('debates')
    .update({
      status: 'ended',
      voting_end_at: votingEndAt.toISOString(),
      ended_at: new Date().toISOString()
    })
    .eq('id', debateId);

  if (error) {
    return NextResponse.json({ error: 'Failed to start voting' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    voting_ends_at: votingEndAt.toISOString()
  });
}

// Get final results
async function getResults(supabase: any, debateId: string) {
  // Get debate
  const { data: debate } = await supabase
    .from('debates')
    .select('*')
    .eq('id', debateId)
    .single();

  // Get votes
  const { data: votes } = await supabase
    .from('debate_votes')
    .select('voted_for_side')
    .eq('debate_id', debateId);

  const voteCounts = {
    proponent: votes?.filter((v: any) => v.voted_for_side === 'proponent').length || 0,
    opponent: votes?.filter((v: any) => v.voted_for_side === 'opponent').length || 0
  };

  // Get AI judge scores
  const { data: judges } = await supabase
    .from('debate_ai_judges')
    .select('*')
    .eq('debate_id', debateId);

  // Calculate winner
  let winner = null;
  const proponentTotal = debate.proponent_score + (voteCounts.proponent * 10);
  const opponentTotal = debate.opponent_score + (voteCounts.opponent * 10);

  if (proponentTotal > opponentTotal) winner = 'proponent';
  else if (opponentTotal > proponentTotal) winner = 'opponent';
  else winner = 'tie';

  return NextResponse.json({
    debate,
    vote_counts: voteCounts,
    ai_judges: judges,
    final_scores: {
      proponent: proponentTotal,
      opponent: opponentTotal
    },
    winner
  });
}