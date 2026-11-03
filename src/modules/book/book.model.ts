import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBookDocument extends Document {
  id?: string;
  customId?: string;
  name: string;
  description?: string;
  authorName: string;
  imageUrl?: string;
  pdfUrl?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IBookModel = Model<IBookDocument>;

const bookSchema = new Schema<IBookDocument, IBookModel>(
  {
    customId: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    id: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Book name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
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

export const Book = mongoose.model<IBookDocument, IBookModel>('Book', bookSchema);

