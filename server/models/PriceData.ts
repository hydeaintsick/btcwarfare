import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceData extends Document {
  timestamp: number;
  price: number;
  source: string;
  createdAt: Date;
}

const PriceDataSchema: Schema = new Schema(
  {
    timestamp: {
      type: Number,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
      default: 'binance',
    },
  },
  {
    timestamps: true,
  }
);

// TTL index pour supprimer automatiquement les données après 15 minutes (900 secondes)
PriceDataSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 900 }
);

export default mongoose.model<IPriceData>('PriceData', PriceDataSchema);

