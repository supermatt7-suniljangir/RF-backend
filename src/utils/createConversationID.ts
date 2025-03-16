/**
 * createConversationId Function
 *
 * Creates a consistent conversation ID between two users,
 * ensuring the same ID is generated regardless of the order of user IDs.
 *
 * @param userId1 - First user's ID
 * @param userId2 - Second user's ID
 * @returns string - A consistent conversation ID
 */
export function createConversationID(userId1: string, userId2: string): string {
  // Convert to string if they're ObjectIds
  const id1 = userId1.toString();
  const id2 = userId2.toString();
  // Create a consistent ID regardless of order
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
}
