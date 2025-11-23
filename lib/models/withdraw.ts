import mongoose, { Schema, Model, Document, models } from "mongoose";

// --- TypeScript Interface (Must be defined for strong typing) ---
export interface IWithdraw extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    walletAddress: string;
    qrImage: string | null;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

// --- Mongoose Schema Definition ---
const withdrawSchema = new Schema<IWithdraw>(
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
        },

        // ❗ final fix – not required
        walletAddress: {
            type: String,
            required: false,
            default: "",
        },

        qrImage: {
            type: String,
            required: false,
            default: null,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        }
    },
    { timestamps: true }
);

// ✅ COMPOUND INDEX - Super fast queries for user + sort by date
withdrawSchema.index({ userId: 1, createdAt: -1 });

// --- Mongoose Model Export (Next.js/TypeScript Safe) ---
// ⭐ FIX: Model<IWithdraw> type assertion ensures TypeScript knows Withdraw is a callable Mongoose Model.
const Withdraw: Model<IWithdraw> = (models.Withdraw || mongoose.model<IWithdraw>("Withdraw", withdrawSchema)) as Model<IWithdraw>;

export default Withdraw;