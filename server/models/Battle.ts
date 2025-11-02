import mongoose, { Schema, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IBattle extends Document {
  longPlayer: Types.ObjectId;
  shortPlayer: Types.ObjectId;
  startPrice: number;
  startTime: Date;
  stakeAmount: number;
  currency: 'ETH' | 'USDT';
  status: 'active' | 'resolved' | 'cancelled';
  winner?: Types.ObjectId;
  resolvedAt?: Date;
}

const BattleSchema: Schema = new Schema(
  {
    longPlayer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shortPlayer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startPrice: {
      type: Number,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
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
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled'],
      default: 'active',
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
BattleSchema.index({ status: 1, startTime: 1 });
BattleSchema.index({ longPlayer: 1, status: 1 });
BattleSchema.index({ shortPlayer: 1, status: 1 });

export default mongoose.model<IBattle>('Battle', BattleSchema);

