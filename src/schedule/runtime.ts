import type { Session } from 'koishi'

const scheduledSessions = new WeakMap<object, { failure?: string }>()

export function markScheduledSession(session: Session): void {
  scheduledSessions.set(session as object, {})
}

export function isScheduledSession(session: Session): boolean {
  return scheduledSessions.has(session as object)
}

export function markScheduledFailure(session: Session, message: string): void {
  const state = scheduledSessions.get(session as object)
  if (state) state.failure = message
}

export function takeScheduledFailure(session: Session): string | undefined {
  const state = scheduledSessions.get(session as object)
  return state?.failure
}
