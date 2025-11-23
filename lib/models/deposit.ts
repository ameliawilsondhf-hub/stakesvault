import mongoose, { Schema, Model, Document, models } from "mongoose";

// --- TypeScript Interface (Must be defined for strong typing) ---
export interface IDeposit extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  screenshot: string | null;
  transactionId: string | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// --- Mongoose Schema Definition ---
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
  },
  {
    timestamps: true,
  }
);

// ✅ COMPOUND INDEX - Super fast queries for user + sort by date
depositSchema.index({ userId: 1, createdAt: -1 });

// --- Mongoose Model Export (Next.js/TypeScript Safe) ---
const Deposit: Model<IDeposit> = (models.Deposit || mongoose.model<IDeposit>("Deposit", depositSchema)) as Model<IDeposit>;

// ✅ MIGRATION: Fix old deposits without /uploads/ prefix
async function fixOldDeposits() {
  try {
    const oldDeposits = await Deposit.find({
      screenshot: {
        $exists: true,
        $ne: null,
        $not: { $regex: "^/uploads/" }
      }
    });

    if (oldDeposits.length > 0) {
      console.log(`🔧 Fixing ${oldDeposits.length} old deposits...`);
      
      for (const deposit of oldDeposits) {
        if (deposit.screenshot) {
          await Deposit.updateOne(
            { _id: deposit._id },
            { $set: { screenshot: `/uploads/${deposit.screenshot}` } }
          );
        }
      }
      
      console.log(`✅ Fixed ${oldDeposits.length} deposits!`);
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}

// Run migration on model load
if (typeof window === "undefined") {
  // Server-side only
  fixOldDeposits().catch(console.error);
}

export default Deposit;