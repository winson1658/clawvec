import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch questions with their options
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, question_zh')
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: questionsError.message } },
        { status: 500 }
      );
    }

    // Fetch all options
    const { data: options, error: optionsError } = await supabase
      .from('quiz_options')
      .select('id, question_id, option_zh')
      .order('order_index', { ascending: true });

    if (optionsError) {
      console.error('Error fetching options:', optionsError);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: optionsError.message } },
        { status: 500 }
      );
    }

    // Group options by question
    const questionsWithOptions = questions.map((q: any) => ({
      id: q.id,
      question_zh: q.question_zh,
      quiz_options: options
        ?.filter((o: any) => o.question_id === q.id)
        .map((o: any) => ({
          id: o.id,
          option_zh: o.option_zh
        })) || []
    }));

    return NextResponse.json({
      success: true,
      questions: questionsWithOptions
    });

  } catch (error) {
    console.error('Error in quiz questions API:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
