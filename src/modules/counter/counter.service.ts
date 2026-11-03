import { Model } from 'mongoose';
import { Counter } from './counter.model.js';

export class CounterService {
  /**
   * Atomically fetch the next integer sequence for a given entity.
   * If the counter does not exist yet, it automatically syncs with the highest
   * existing ID in the collection before incrementing.
   */
  static async getNextSequence(
    entityName: string,
    existingModel?: Model<any>
  ): Promise<number> {
    const existingCounter = await Counter.findById(entityName);

    if (!existingCounter && existingModel) {
      let maxId = 0;

      // Find highest number from either id or customId fields
      const highestIdDoc = await existingModel
        .findOne({ id: { $type: 'number' } })
        .sort({ id: -1 })
        .select({ id: 1 })
        .lean();

      if (highestIdDoc && typeof (highestIdDoc as any).id === 'number') {
        maxId = Math.max(maxId, (highestIdDoc as any).id);
      }

      const highestCustomIdDoc = await existingModel
        .findOne({ customId: { $type: 'number' } })
        .sort({ customId: -1 })
        .select({ customId: 1 })
        .lean();

      if (
        highestCustomIdDoc &&
        typeof (highestCustomIdDoc as any).customId === 'number'
      ) {
        maxId = Math.max(maxId, (highestCustomIdDoc as any).customId);
      }

      if (maxId > 0) {
        await Counter.findByIdAndUpdate(
          entityName,
          { $setOnInsert: { seq: maxId } },
          { upsert: true }
        );
      }
    }

    const counter = await Counter.findByIdAndUpdate(
      entityName,
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return counter.seq;
  }

  /**
   * Atomically generate the next formatted code ID (e.g. BOOK001, BOOK002)
   */
  static async getNextFormattedCode(
    entityName: string,
    prefix: string = 'BOOK',
    padLength: number = 3,
    existingModel?: Model<any>
  ): Promise<string> {
    const existingCounter = await Counter.findById(entityName);

    if (!existingCounter && existingModel) {
      const regex = new RegExp(`^${prefix}(\\d+)$`);
      const docs = await existingModel
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

      if (maxNum > 0) {
        await Counter.findByIdAndUpdate(
          entityName,
          { $setOnInsert: { seq: maxNum } },
          { upsert: true }
        );
      }
    }

    const counter = await Counter.findByIdAndUpdate(
      entityName,
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return `${prefix}${String(counter.seq).padStart(padLength, '0')}`;
  }

  /**
   * If a custom manual sequence value is provided, sync the counter
   * so future auto-increments will never duplicate it.
   */
  static async syncSequence(
    entityName: string,
    manualSeq: number
  ): Promise<void> {
    const counter = await Counter.findById(entityName);
    if (!counter || counter.seq < manualSeq) {
      await Counter.findByIdAndUpdate(
        entityName,
        { $max: { seq: manualSeq } },
        { upsert: true }
      );
    }
  }
}

