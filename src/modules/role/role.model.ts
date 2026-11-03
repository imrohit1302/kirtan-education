import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IRoleDocument extends Document {
  id?: number;
  customId?: number;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleModel extends Model<IRoleDocument> {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
}

const roleSchema = new Schema<IRoleDocument, IRoleModel>(
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
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
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

roleSchema.statics.isSlugTaken = async function (
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query: Record<string, any> = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const role = await this.findOne(query);
  return !!role;
};

export const Role = mongoose.model<IRoleDocument, IRoleModel>('Role', roleSchema);

