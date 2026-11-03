import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategoryDocument extends Document {
  id?: number;
  customId?: number;
  name_unicode: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryModel extends Model<ICategoryDocument> {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
}

const categorySchema = new Schema<ICategoryDocument, ICategoryModel>(
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
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
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
        ret.id = ret.customId ?? ret.id ?? ret._id?.toString();
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

categorySchema.statics.isSlugTaken = async function (
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query: Record<string, any> = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const category = await this.findOne(query);
  return !!category;
};

export const Category = mongoose.model<ICategoryDocument, ICategoryModel>(
  'Category',
  categorySchema
);

