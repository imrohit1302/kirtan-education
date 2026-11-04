import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRaagDocument extends Document {
  id?: any;
  customId?: any;
  name_unicode: string;
  name: string;
  slug: string;
  display_order: number;
  aroh?: string | null;
  avroh?: string | null;
  pakad?: string | null;
  thaat?: string | null;
  jaati?: string | null;
  vaadi?: string | null;
  samvadi?: string | null;
  time?: string | null;
  sur?: string | null;
  wargit_sur?: string | null;
  description?: string | null;
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
      type: Schema.Types.Mixed,
      index: true,
      sparse: true,
    },
    id: {
      type: Schema.Types.Mixed,
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
      default: null,
    },
    avroh: {
      type: String,
      default: null,
    },
    pakad: {
      type: String,
      default: null,
    },
    thaat: {
      type: String,
      default: null,
    },
    jaati: {
      type: String,
      default: null,
    },
    vaadi: {
      type: String,
      default: null,
    },
    samvadi: {
      type: String,
      default: null,
    },
    time: {
      type: String,
      default: null,
    },
    sur: {
      type: String,
      default: null,
    },
    wargit_sur: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
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
