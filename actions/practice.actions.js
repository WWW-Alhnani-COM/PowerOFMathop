'use server'

import { prisma } from '@/lib/prisma'
import { validateSession } from './auth.actions'

export async function submitAnswer({
  result_id,
  problem,
  user_answer,
  time_spent
}) {
  const session = await validateSession()
  if (!session.success) return session

  const is_correct = String(user_answer) === String(problem.correct_answer)

  await prisma.answerDetail.create({
    data: {
      result_id,
      problem_type_id: problem.problem_type_id ?? null,
      problem_data: JSON.stringify(problem),
      user_answer: String(user_answer),
      correct_answer: String(problem.correct_answer),
      is_correct,
      time_spent,
      sequence_number: problem.sequence_number
    }
  })

  return { success: true }
}
