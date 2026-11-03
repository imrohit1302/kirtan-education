import mongoose, { Model } from 'mongoose';

/**
 * Generate a slug from text.
 * Handles English and unicode text gracefully.
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

interface IdQueryOptions {
  hasSlug?: boolean;
  extraFields?: string[];
}

/**
 * Smart identifier query builder.
 * Resolves by MongoDB _id (if valid ObjectId), numeric customId/id, string customId/id, or slug.
 */
export const buildIdQuery = (
  identifier: string | number,
  options: IdQueryOptions = {}
): Record<string, any> => {
  const strId = String(identifier).trim();
  const conditions: Record<string, any>[] = [];

  // 1. Check if valid MongoDB ObjectId
  if (mongoose.isValidObjectId(strId)) {
    conditions.push({ _id: strId });
  }

  // 2. Check if numeric
  const numId = Number(strId);
  const isNumeric = !Number.isNaN(numId) && strId !== '';
  if (isNumeric) {
    conditions.push({ customId: numId });
    conditions.push({ id: numId });
  }

  // 3. String match on customId or id
  conditions.push({ customId: strId });
  conditions.push({ id: strId });

  // 4. Optional slug match
  if (options.hasSlug) {
    conditions.push({ slug: strId.toLowerCase() });
  }

  // 5. Any extra fields (e.g. bookCode)
  if (options.extraFields && options.extraFields.length > 0) {
    for (const field of options.extraFields) {
      conditions.push({ [field]: strId });
    }
  }

  return { $or: conditions };
};

/**
 * Auto-increment helper to get next numeric ID for an entity
 */
export const getNextNumericId = async (
  model: Model<any>,
  idField: string = 'customId'
): Promise<number> => {
  const highestDoc = await model
    .findOne({ [idField]: { $type: 'number' } })
    .sort({ [idField]: -1 })
    .select({ [idField]: 1 })
    .lean();

  if (highestDoc && typeof (highestDoc as any)[idField] === 'number') {
    return (highestDoc as any)[idField] + 1;
  }
  return 1;
};

/**
 * Auto-generate next Book code (e.g., BOOK001, BOOK002)
 */
export const getNextBookCode = async (
  model: Model<any>,
  prefix: string = 'BOOK'
): Promise<string> => {
  const regex = new RegExp(`^${prefix}(\\d+)$`);
  const docs = await model
    .find({
      $or: [{ id: { $regex: regex } }, { customId: { $regex: regex } }],
    })
    .select({ id: 1, customId: 1 })
    .lean();

  let maxNum = 0;
  for (const doc of docs) {
    const rawCode = (doc as any).id || (doc as any).customId;
    if (typeof rawCode === 'string') {
      const match = rawCode.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
};
