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
  currentAmount: number;        // Current amount (with simple interest profit)
  
  // Dates
  startDate: Date;
  unlockDate: Date;
  lastProfitDate: Date;
  
  // Lock Period
  lockPeriod: number;           // ✅ UPDATED: Now supports 30-1825 days
  
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
    
    // Lock Period - ✅ UPDATED: Support all durations (30d to 5 years)
    lockPeriod: {
      type: Number,
      required: true,
      enum: [30, 60, 90, 120, 180, 270, 365, 730, 1095, 1460, 1825], // ✅ All 11 plans
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

// ✅ FIXED: Simple Interest - Daily Profit Method
StakeSchema.methods.addDailyProfit = function() {
  // ✅ CRITICAL FIX: Use originalAmount (not currentAmount) for simple interest
  const profit = this.originalAmount * 0.01; // 1% of ORIGINAL amount
  
  // ✅ DON'T update currentAmount - keep it same as original for simple interest
  // this.currentAmount stays unchanged
  
  // ✅ Only update totalProfit
  this.totalProfit += profit;
  
  // Add to history
  this.profitHistory.push({
    date: new Date(),
    profit: profit,
    balanceAfter: this.originalAmount + this.totalProfit // Show total value
  });
  
  this.lastProfitDate = new Date();
  
  console.log(`💰 Daily profit added: $${profit.toFixed(2)} (Simple Interest)`);
  console.log(`   Original: $${this.originalAmount} | Total Profit: $${this.totalProfit.toFixed(2)}`);
  
  return profit;
};

// ✅ Unlock Method (No changes needed - already OK)
StakeSchema.methods.unlock = function() {
  this.status = 'unlocked';
  
  // Update currentAmount to include all profits when unlocking
  this.currentAmount = this.originalAmount + this.totalProfit;
  
  // Set auto re-lock date (48 hours from now)
  const relockDate = new Date();
  relockDate.setHours(relockDate.getHours() + 48);
  this.autoRelockAt = relockDate;
  
  console.log(`🔓 Stake unlocked: $${this.originalAmount} + $${this.totalProfit} = $${this.currentAmount}`);
};

// ✅ Re-lock Method (No changes needed - already OK)
StakeSchema.methods.relock = function() {
  const now = new Date();
  this.status = 'locked';
  this.startDate = now;
  
  // ✅ IMPORTANT: When re-locking, the currentAmount becomes the new originalAmount
  this.originalAmount = this.currentAmount;
  this.totalProfit = 0; // Reset profit for new cycle
  
  // Set new unlock date based on same lock period
  const newUnlockDate = new Date(now);
  newUnlockDate.setDate(newUnlockDate.getDate() + this.lockPeriod);
  this.unlockDate = newUnlockDate;
  
  this.lastProfitDate = now;
  this.autoRelockAt = null;
  this.cycle += 1;
  
  console.log(`🔒 Stake re-locked: Cycle ${this.cycle} | Amount: $${this.originalAmount}`);
};

// Mongoose Model Export
const Stake: Model<IStake> = (models.Stake || mongoose.model<IStake>("Stake", StakeSchema)) as Model<IStake>;

export default Stake;