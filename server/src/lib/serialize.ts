// src/lib/serialize.ts
/**
 * Convert session data into a markdown summary
 * suitable for vector store ingestion.
 */
export function serializeSession(session: any): string {
  const { user, user_id, stats, notes, accuracy, form_score, shots_count, duration_seconds } = session || {};

  return `
# Session Summary

**User:** ${user || user_id || "Unknown"}
**Date:** ${new Date().toISOString()}

## Shooting Performance
- Accuracy: ${accuracy ?? stats?.accuracy ?? "N/A"}%
- Form Score: ${form_score ?? stats?.consistency ?? "N/A"}%
- Shots Count: ${shots_count ?? "N/A"}
- Duration: ${duration_seconds ? `${duration_seconds}s` : "N/A"}

## Coach Notes
${notes || "No notes provided."}
  `;
}
