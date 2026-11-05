import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IBookmarkDocument extends Document {
  userId: Types.ObjectId;
  tutorialId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IBookmarkModel = Model<IBookmarkDocument>;

const bookmarkSchema = new Schema<IBookmarkDocument, IBookmarkModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    tutorialId: {
      type: Schema.Types.ObjectId,
      ref: 'Tutorial',
      required: [true, 'Tutorial ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Ensure a user can only bookmark a tutorial once
bookmarkSchema.index({ userId: 1, tutorialId: 1 }, { unique: true });

export const Bookmark = mongoose.model<IBookmarkDocument, IBookmarkModel>(
  'Bookmark',
  bookmarkSchema
);
