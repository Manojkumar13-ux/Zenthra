import { ObjectId } from "mongodb";

/**
 * Convert a string ID to MongoDB ObjectId
 * @throws Error if ID is invalid
 */
export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new ObjectId(id);
}

/**
 * Safely convert a string ID to MongoDB ObjectId
 * @returns ObjectId or null if invalid
 */
export function safeToObjectId(id: string): ObjectId | null {
  try {
    if (ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Convert ObjectId to string safely
 */
export function objectIdToString(id: ObjectId | string): string {
  if (typeof id === "string") {
    if (isValidObjectId(id)) {
      return id;
    }
    throw new Error(`Invalid ObjectId string: ${id}`);
  }
  return id.toString();
}

/**
 * Compare two IDs (strings or ObjectIds)
 */
export function compareIds(id1: string | ObjectId, id2: string | ObjectId): boolean {
  const str1 = typeof id1 === "string" ? id1 : id1.toString();
  const str2 = typeof id2 === "string" ? id2 : id2.toString();
  return str1 === str2;
}
