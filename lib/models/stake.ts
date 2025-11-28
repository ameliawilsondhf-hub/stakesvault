import mongoose, { Schema, Model, Document, models } from "mongoose";

// Profit History Interface
export interface IProfitHistory {
  date: Date;
  profit: number;
  balanceAfter: number;
}

// Main Stake Interface
export interface IStake extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Amounts
  originalAmount: number;      // Initial stake amount
  currentAmount: number;        // Current amount (with compounded profit)
  
  // Dates
  startDate: Date;
  unlockDate: Date;
  lastProfitDate: Date;
  
  // Lock Period
  lockPeriod: number;           // 30, 60, or 90 days
  
  // Status
  status: 'locked' | 'unlocked';
  
  // Profit Tracking
  totalProfit: number;
  profitHistory: IProfitHistory[];
  
  // Cycle Management
  cycle: number;                // 1st cycle, 2nd cycle, etc.
  
  // Auto Re-Lock
  autoRelock: boolean;          // Should auto re-lock?
  autoRelockAt: Date | null;    // When to auto re-lock (48 hours after unlock)
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Helper Methods
  addDailyProfit(): number;
  unlock(): void;
  relock(): void;
}

// Profit History Schema
const ProfitHistorySchema = new Schema({
  date: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  profit: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, { _id: false });

// Main Stake Schema
const StakeSchema = new Schema<IStake>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    
    // Amounts
    originalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currentAmount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Dates
    startDate: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    unlockDate: {
      type: Date,
      required: true
    },
    lastProfitDate: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    
    // Lock Period
    lockPeriod: {
      type: Number,
      required: true,
      enum: [30, 60, 90],
      index: true
    },
    
    // Status
    status: {
      type: String,
      enum: ["locked", "unlocked"],
      default: "locked",
      index: true
    },
    
    // Profit Tracking
    totalProfit: {
      type: Number,
      default: 0,
      min: 0
    },
    profitHistory: {
      type: [ProfitHistorySchema],
      default: []
    },
    
    // Cycle Management
    cycle: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    
    // Auto Re-Lock
    autoRelock: {
      type: Boolean,
      default: true
    },
    autoRelockAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for Performance
StakeSchema.index({ userId: 1, createdAt: -1 });
StakeSchema.index({ status: 1, unlockDate: 1 });
StakeSchema.index({ status: 1, lastProfitDate: 1 });
StakeSchema.index({ autoRelock: 1, autoRelockAt: 1 });

// Helper Methods
StakeSchema.methods.addDailyProfit = function() {
  const profit = this.currentAmount * 0.01; // 1% daily
  this.currentAmount += profit;
  this.totalProfit += profit;
  
  // Add to history
  this.profitHistory.push({
    date: new Date(),
    profit: profit,
    balanceAfter: this.currentAmount
  });
  
  this.lastProfitDate = new Date();
  return profit;
};

StakeSchema.methods.unlock = function() {
  this.status = 'unlocked';
  
  // Set auto re-lock date (48 hours from now)
  const relockDate = new Date();
  relockDate.setHours(relockDate.getHours() + 48);
  this.autoRelockAt = relockDate;
};

StakeSchema.methods.relock = function() {
  const now = new Date();
  this.status = 'locked';
  this.startDate = now;
  
  // Set new unlock date based on same lock period
  const newUnlockDate = new Date(now);
  newUnlockDate.setDate(newUnlockDate.getDate() + this.lockPeriod);
  this.unlockDate = newUnlockDate;
  
  this.lastProfitDate = now;
  this.autoRelockAt = null;
  this.cycle += 1;
};

// Mongoose Model Export
const Stake: Model<IStake> = (models.Stake || mongoose.model<IStake>("Stake", StakeSchema)) as Model<IStake>;

export default Stake;