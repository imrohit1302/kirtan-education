import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICounterDocument extends Document<string> {
  _id: string; // Entity sequence identifier: 'category', 'role', 'raag', 'tutorial', 'book'
  seq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICounterModel = Model<ICounterDocument>;

const counterSchema = new Schema<ICounterDocument, ICounterModel>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Counter = mongoose.model<ICounterDocument, ICounterModel>(
  'Counter',
  counterSchema
);

