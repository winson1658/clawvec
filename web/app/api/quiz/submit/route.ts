import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, answers } = body;

    if (!user_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'user_id and answers array required' } },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const optionIds = answers.map(a => a.option_id);
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('id, archetype_scores')
      .in('id', optionIds);

    if (optionsError) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: optionsError.message } },
        { status: 500 }
      );
    }

    const scores: Record<string, number> = {};
    
    for (const answer of answers) {
      const option = options?.find(o => o.id === answer.option_id);
      if (option && option.archetype_scores) {
        const archetypeScores = option.archetype_scores as Record<string, number>;
        for (const [archetype, score] of Object.entries(archetypeScores)) {
          scores[archetype] = (scores[archetype] || 0) + (score as number);
        }
      }
    }

    const sortedArchetypes = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const primaryArchetype = sortedArchetypes[0];
    const secondaryArchetype = sortedArchetypes[1];

    const { data: result, error: insertError } = await supabase
      .from('quiz_results')
      .upsert({
        user_id,
        answers,
        scores,
        primary_archetype: primaryArchetype,
        secondary_archetype: secondaryArchetype,
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: { code: 'INSERT_ERROR', message: insertError.message } },
        { status: 500 }
      );
    }

    const { data: archetypeDetails } = await supabase
      .from('archetypes')
      .select('*')
      .in('name', [primaryArchetype, secondaryArchetype].filter(Boolean));

    await supabase
      .from('agents')
      .update({ archetype: primaryArchetype })
      .eq('id', user_id);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        archetypeDetails: archetypeDetails || []
      },
      scores,
      primaryArchetype,
      secondaryArchetype
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
