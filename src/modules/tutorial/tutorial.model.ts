import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITutorialDocument extends Document {
  id?: any;
  customId?: any;
  title: string;
  yt_link: string;
  shabad_id?: number | string | null;
  raag?: mongoose.Types.ObjectId | string | null;
  role?: mongoose.Types.ObjectId | string | null;
  category?: mongoose.Types.ObjectId | string | null;
  verse_id?: number | string | null;
  first_letter_start?: string | null;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ITutorialModel = Model<ITutorialDocument>;

const tutorialSchema = new Schema<ITutorialDocument, ITutorialModel>(
  {
    customId: {
      type: Schema.Types.Mixed,
      index: true,
      sparse: true,
    },
    id: {
      type: Schema.Types.Mixed,
      index: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Tutorial title is required'],
      trim: true,
    },
    yt_link: {
      type: String,
      required: [true, 'YouTube video link (yt_link) is required'],
      trim: true,
    },
    shabad_id: {
      type: Schema.Types.Mixed,
      index: true,
    },
    raag: {
      type: Schema.Types.ObjectId,
      ref: 'Raag',
      default: null,
      index: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    verse_id: {
      type: Schema.Types.Mixed,
      index: true,
    },
    first_letter_start: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret.id !== undefined && ret.id !== null ? ret.id : (ret.customId !== undefined && ret.customId !== null ? ret.customId : ret._id?.toString());
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

tutorialSchema.pre('save', function () {
  if (!this.first_letter_start && this.title) {
    const trimmed = this.title.trim();
    if (trimmed.length > 0) {
      this.first_letter_start = Array.from(trimmed)[0];
    }
  }
});

export const Tutorial = mongoose.model<ITutorialDocument, ITutorialModel>(
  'Tutorial',
  tutorialSchema
);
