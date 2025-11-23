import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlockedIP extends Document {
  ip: string;
  reason?: string;
  blockedAt: Date;
  expiresAt?: Date | null;
  attempts: number;
  permanent: boolean;
}

const BlockedIPSchema = new Schema<IBlockedIP>({
  ip: { type: String, required: true, index: true, unique: true },
  reason: { type: String, default: "" },
  blockedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  permanent: { type: Boolean, default: false },
});

const BlockedIP: Model<IBlockedIP> =
  (mongoose.models.BlockedIP as Model<IBlockedIP>) ||
  mongoose.model<IBlockedIP>("BlockedIP", BlockedIPSchema);

export default BlockedIP;
