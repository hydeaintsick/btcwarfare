import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderBookSnapshot extends Document {
  timestamp: number;
  bids: Array<[number, number]>; // [price, quantity]
  asks: Array<[number, number]>; // [price, quantity]
  createdAt: Date;
}

const OrderBookSnapshotSchema: Schema = new Schema(
  {
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    bids: {
      type: [[Number]],
      required: true,
    },
    asks: {
      type: [[Number]],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index pour supprimer automatiquement les données après 6 minutes (360 secondes)
OrderBookSnapshotSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 360 }
);

export default mongoose.model<IOrderBookSnapshot>('OrderBookSnapshot', OrderBookSnapshotSchema);

