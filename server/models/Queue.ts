import mongoose, { Schema, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IQueue extends Document {
  userId: Types.ObjectId;
  position: 'long' | 'short';
  stakeAmount: number;
  currency: 'ETH' | 'USDT';
  joinedAt: Date;
}

const QueueSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un utilisateur ne peut être que dans une queue à la fois
    },
    position: {
      type: String,
      enum: ['long', 'short'],
      required: true,
    },
    stakeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['ETH', 'USDT'],
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for FIFO matching
QueueSchema.index({ position: 1, joinedAt: 1 });

export default mongoose.model<IQueue>('Queue', QueueSchema);

