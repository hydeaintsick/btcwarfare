import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformConfig extends Document {
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformConfigSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlatformConfig>('PlatformConfig', PlatformConfigSchema);

