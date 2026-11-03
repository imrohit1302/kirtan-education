import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRaagDocument extends Document {
  id?: number;
  customId?: number;
  name_unicode: string;
  name: string;
  slug: string;
  display_order: number;
  aroh?: string;
  avroh?: string;
  pakad?: string;
  thaat?: string;
  jaati?: string;
  vaadi?: string;
  samvadi?: string;
  time?: string;
  sur?: string;
  wargit_sur?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRaagModel extends Model<IRaagDocument> {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
}

const raagSchema = new Schema<IRaagDocument, IRaagModel>(
  {
    customId: {
      type: Number,
      index: true,
      sparse: true,
    },
    id: {
      type: Number,
      index: true,
      sparse: true,
    },
    name_unicode: {
      type: String,
      required: [true, 'Unicode Punjabi name (name_unicode) is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Raag name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Raag slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    display_order: {
      type: Number,
      default: 1,
      index: true,
    },
    aroh: {
      type: String,
      trim: true,
    },
    avroh: {
      type: String,
      trim: true,
    },
    pakad: {
      type: String,
      trim: true,
    },
    thaat: {
      type: String,
      trim: true,
    },
    jaati: {
      type: String,
      trim: true,
    },
    vaadi: {
      type: String,
      trim: true,
    },
    samvadi: {
      type: String,
      trim: true,
    },
    time: {
      type: String,
      trim: true,
    },
    sur: {
      type: String,
      trim: true,
    },
    wargit_sur: {
      type: String,
      trim: true,
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
        ret.id = ret.customId ?? ret.id ?? ret._id?.toString();
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

raagSchema.statics.isSlugTaken = async function (
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query: Record<string, any> = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const raag = await this.findOne(query);
  return !!raag;
};

export const Raag = mongoose.model<IRaagDocument, IRaagModel>('Raag', raagSchema);

