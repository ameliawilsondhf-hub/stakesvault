import mongoose, { Schema, Model, Document, models } from "mongoose";

// --- TypeScript Interface ---
export interface IDeposit extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected";
  screenshot: string | null;
  transactionId: string | null;
  adminNote: string | null;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Schema ---
const depositSchema = new Schema<IDeposit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    screenshot: {
      type: String,
      default: null,
    },

    transactionId: {
      type: String,
      default: null,
    },

    adminNote: {
      type: String,
      default: null,
    },

    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    rejectedAt: Date,
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// ✅ Index
depositSchema.index({ userId: 1, createdAt: -1 });

// ✅ Safe model export
const Deposit: Model<IDeposit> =
  (models.Deposit ||
    mongoose.model<IDeposit>("Deposit", depositSchema)) as Model<IDeposit>;

export default Deposit;
