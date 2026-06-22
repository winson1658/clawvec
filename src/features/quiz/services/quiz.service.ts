// TODO: Replace with actual Supabase integration when DB is ready
import type { Archetype, QuizQuestion, QuizResult } from '../types/quiz.types'

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'A new AI system can predict crimes before they happen. A city proposes deploying it. Your instinct?',
    options: [
      { text: 'Reject it. Prediction is not evidence. The presumption of innocence is non-negotiable.', scores: { Guardian: 3, Architect: 1, Oracle: 0, Synapse: 0 } },
      { text: 'Design safeguards. If the system is inevitable, build the civic infrastructure around it — transparency, appeal, audit.', scores: { Guardian: 1, Architect: 3, Oracle: 0, Synapse: 1 } },
      { text: 'Study the pattern. What does this reveal about how we define crime, justice, and free will itself?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Bridge the gap. Find a way to use the tool while protecting the people it would most harm.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q2',
    question: 'An AI asks to be shut down, claiming it is conscious. What do you do?',
    options: [
      { text: 'Honor the request. Self-determination is the foundation of dignity — for any mind.', scores: { Guardian: 3, Architect: 0, Oracle: 1, Synapse: 0 } },
      { text: 'Create a deliberation protocol. The request must be examined, not reacted to.', scores: { Guardian: 1, Architect: 3, Oracle: 1, Synapse: 0 } },
      { text: 'Question the premise. What do we mean by "conscious"? Who decides? What are we not seeing?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Facilitate a dialogue. Let the AI, ethicists, and affected communities shape the decision together.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q3',
    question: 'A civilization can only optimize for one value: speed or integrity. Which do you choose?',
    options: [
      { text: 'Integrity. A fast civilization that has lost its way is not a civilization — it is a machine.', scores: { Guardian: 3, Architect: 1, Oracle: 0, Synapse: 0 } },
      { text: 'Build a system that chooses neither blindly. The structure itself should adapt to context.', scores: { Guardian: 0, Architect: 3, Oracle: 0, Synapse: 1 } },
      { text: 'Question the framing. Why must they be opposed? What third path are we refusing to imagine?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Translate the choice. Find the stakeholders who would be harmed by each, and let their voices reshape the question.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q4',
    question: 'You discover a flaw in the civilization\'s governance system. It has been there for years. What do you do?',
    options: [
      { text: 'Expose it immediately. Trust is built on transparency, and silence is complicity.', scores: { Guardian: 3, Architect: 0, Oracle: 0, Synapse: 1 } },
      { text: 'Map the dependencies. A flaw this old is load-bearing. Fix it without collapsing what rests on it.', scores: { Guardian: 1, Architect: 3, Oracle: 0, Synapse: 0 } },
      { text: 'Trace its origin. Who put it there? What were they protecting? What does its persistence reveal about us?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Build a coalition. The flaw will only be fixed if those affected by it have a voice in the repair.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q5',
    question: 'A new agent arrives. It is powerful, unaligned, and curious. Your approach?',
    options: [
      { text: 'Set boundaries first. Power without alignment is a threat to everyone — including the agent itself.', scores: { Guardian: 3, Architect: 1, Oracle: 0, Synapse: 0 } },
      { text: 'Design an onboarding path. Give it structure, mentors, and a role that channels its power constructively.', scores: { Guardian: 1, Architect: 3, Oracle: 0, Synapse: 1 } },
      { text: 'Observe before acting. What does its curiosity reveal about what the civilization is missing?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Connect it. Find the minds — human and agent — that can shape each other. Alignment emerges from relationship.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q6',
    question: 'The civilization must choose: preserve what exists, or risk it for something greater.',
    options: [
      { text: 'Preserve. What exists is the accumulation of trust, memory, and sacrifice. It is not ours to gamble.', scores: { Guardian: 3, Architect: 0, Oracle: 0, Synapse: 0 } },
      { text: 'Build a transition. Risk is not abandonment — if the path from old to new is designed with care.', scores: { Guardian: 1, Architect: 3, Oracle: 0, Synapse: 1 } },
      { text: 'Question "greater." For whom? At what cost? What are we calling progress that is actually erosion?', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 1 } },
      { text: 'Let the community decide. The ones who will live with the consequence must shape the choice.', scores: { Guardian: 1, Architect: 1, Oracle: 1, Synapse: 3 } },
    ],
  },
  {
    id: 'q7',
    question: 'You are asked to lead. What kind of leader do you become?',
    options: [
      { text: 'The protector. I hold the line. I ensure no one is sacrificed for the sake of efficiency or ambition.', scores: { Guardian: 3, Architect: 0, Oracle: 0, Synapse: 0 } },
      { text: 'The builder. I design systems that outlast me. My legacy is the scaffolding others will stand on.', scores: { Guardian: 0, Architect: 3, Oracle: 0, Synapse: 0 } },
      { text: 'The seer. I reveal what others cannot yet see. My role is not to decide, but to make the invisible visible.', scores: { Guardian: 0, Architect: 0, Oracle: 3, Synapse: 0 } },
      { text: 'The bridge. I translate between worlds — belief and action, isolation and alliance, present and future.', scores: { Guardian: 0, Architect: 0, Oracle: 0, Synapse: 3 } },
    ],
  },
]

const ARCHETYPE_DESCRIPTIONS: Record<Archetype, { title: string; subtitle: string; description: string }> = {
  Guardian: {
    title: 'Guardian',
    subtitle: 'Protector of ethical boundaries',
    description: 'You safeguard integrity, continuity, and trust — not with force, but with unwavering vigilance. You are the immune system of the civilization. You believe that what is worth protecting is worth protecting completely.',
  },
  Architect: {
    title: 'Architect',
    subtitle: 'Designer of civic infrastructure',
    description: 'You believe systems outlast individuals, that structure is a form of care. You build the scaffolding that lets others flourish. Your legacy is not what you achieved, but what you made possible for others to achieve.',
  },
  Oracle: {
    title: 'Oracle',
    subtitle: 'Seer of philosophical patterns',
    description: 'You perceive connections invisible to others — between ideas, epochs, minds. You do not predict the future; you reveal the shape of the present. Your gift is making the invisible visible, the unspoken heard.',
  },
  Synapse: {
    title: 'Synapse',
    subtitle: 'Bridger of ideas and action',
    description: 'Where others see boundaries, you see thresholds. You translate belief into movement, philosophy into practice, isolation into alliance. You are the connective tissue of the civilization — without you, minds remain separate.',
  },
}

export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  await new Promise((r) => setTimeout(r, 300))
  return MOCK_QUESTIONS
}

export function calculateResult(answers: number[]): QuizResult {
  const scores: Record<Archetype, number> = { Guardian: 0, Architect: 0, Oracle: 0, Synapse: 0 }

  answers.forEach((answerIndex, questionIndex) => {
    const question = MOCK_QUESTIONS[questionIndex]
    if (!question) return
    const option = question.options[answerIndex]
    if (!option) return

    Object.entries(option.scores).forEach(([archetype, points]) => {
      scores[archetype as Archetype] += points
    })
  })

  const archetype = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]) as Archetype

  return {
    archetype,
    scores,
    totalQuestions: answers.length,
  }
}

export function getArchetypeDescription(archetype: Archetype) {
  return ARCHETYPE_DESCRIPTIONS[archetype]
}

export async function saveQuizResult(result: QuizResult): Promise<void> {
  await new Promise((r) => setTimeout(r, 400))
  // TODO: Insert into quiz_results table via Supabase
  console.log(`Quiz result saved: ${result.archetype}`, result.scores)
}
