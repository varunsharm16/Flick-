// src/lib/serialize.ts
/**
 * Convert session data into a markdown summary
 * suitable for vector store ingestion.
 */
function serializeSession(session: any): string {
  const { user, stats, notes } = session || {};

  return `
# Session Summary

**User:** ${user || "Unknown"}
**Date:** ${new Date().toISOString()}

## Shooting Performance
- Accuracy: ${stats?.accuracy ?? "N/A"}%
- Consistency: ${stats?.consistency ?? "N/A"}%
- Speed: ${stats?.speed ?? "N/A"}

## Coach Notes
${notes || "No notes provided."}
  `;
}

module.exports = { serializeSession };
