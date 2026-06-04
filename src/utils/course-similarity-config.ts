export type CourseSimilarityConfig = {
  threshold: number
}

export const FALLBACK_COURSE_SIMILARITY_CONFIG: CourseSimilarityConfig = {
  threshold: 0.82,
}

export const MIN_COURSE_SIMILARITY_THRESHOLD = 0.5
export const MAX_COURSE_SIMILARITY_THRESHOLD = 0.99

export const normalizeCourseSimilarityConfig = (
  input?: Partial<CourseSimilarityConfig> | null,
): CourseSimilarityConfig => {
  const raw = Number(input?.threshold ?? FALLBACK_COURSE_SIMILARITY_CONFIG.threshold)
  const threshold = Number.isFinite(raw)
    ? Math.min(MAX_COURSE_SIMILARITY_THRESHOLD, Math.max(MIN_COURSE_SIMILARITY_THRESHOLD, Math.round(raw * 100) / 100))
    : FALLBACK_COURSE_SIMILARITY_CONFIG.threshold
  return { threshold }
}

export const formatSimilarityThresholdPercent = (threshold: number) =>
  `${Math.round(threshold * 100)}%`
