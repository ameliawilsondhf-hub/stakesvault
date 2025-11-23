import mongoose, { Schema, Model, Document, models } from "mongoose";

// --- TypeScript Interface (Updated to include 'cycle') ---
export interface IStake extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    originalAmount: number;
    startDate: Date;
    unlockDate: Date;
    lastProfitDate: Date;
    autoLockCheckDate: Date;
    status: 'locked' | 'unlocked';
    totalProfit: number;
    cycle: number; // ⭐ ADDED THIS PROPERTY
    createdAt: Date;
    updatedAt: Date;
}

// --- Mongoose Schema Definition (Updated to include 'cycle') ---
const StakeSchema = new Schema<IStake>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: { type: Number, required: true },
        originalAmount: { type: Number, required: true },

        startDate: { type: Date, required: true },
        unlockDate: { type: Date, required: true },

        lastProfitDate: { type: Date, required: true },
        
        autoLockCheckDate: { type: Date, default: () => new Date() },

        status: {
            type: String,
            enum: ["locked", "unlocked"],
            default: "locked",
        },

        totalProfit: { type: Number, default: 0 },
        
        // ⭐ ADDED THIS PROPERTY
        cycle: { 
            type: Number, 
            required: true, 
            default: 1, // Cycle should start at 1
            min: 1
        }, 
    },
    { timestamps: true }
);

// Mongoose Model Export (Next.js/TypeScript Safe)
const Stake: Model<IStake> = (models.Stake || mongoose.model<IStake>("Stake", StakeSchema)) as Model<IStake>;

export default Stake;