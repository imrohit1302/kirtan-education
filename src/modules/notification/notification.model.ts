import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  imageUrl?: string | null;
  type: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type INotificationModel = Model<INotificationDocument>;

const notificationSchema = new Schema<INotificationDocument, INotificationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must be associated with a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Notification description/body is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      default: 'GENERAL',
      trim: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id?.toString();
        ret.created_at = ret.createdAt;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for optimized user notification feed & unread queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument, INotificationModel>(
  'Notification',
  notificationSchema
);
