import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "stake"
  | "win"
  | "commission"
  | "fee";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: "ETH" | "USDT";
  txHash?: string;
  status:
    | "pending"
    | "completed"
    | "failed"
    | "canceled"
    | "rejected"
    | "refunded";
  relatedBattleId?: Types.ObjectId;
  feeAmount?: number; // For deposits, withdrawals, and stakes, this is the 5% platform fee
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdrawal", "stake", "win", "commission", "fee"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["ETH", "USDT"],
      required: true,
    },
    txHash: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "canceled",
        "rejected",
        "refunded",
      ],
      default: "pending",
    },
    relatedBattleId: {
      type: Schema.Types.ObjectId,
      ref: "Battle",
    },
    feeAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ txHash: 1 }, { sparse: true });

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
