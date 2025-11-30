import mongoose, { Schema, Document, Model, Types } from "mongoose";

// --- TypeScript Interfaces ---

interface ISecurityLog {
    type: string;
    ip: string;
    device: string;
    location: string;
    risk: number;
    date: Date;
}

interface ILoginIP {
    ip: string;
    lastLogin: Date;
    count: number;

}

interface ILoginHistory {
    ip: string;
    location: string;
    device: string;
    browser: string;
    os: string;
    timestamp: Date;
    suspicious: boolean;
}

interface IDevice {
    name: string;
    deviceId: string;
    browser: string;
    os: string;
    lastUsed: Date;
    firstSeen: Date;
    trusted: boolean;
    ipAddress: string;
    location: string;
}

interface ISecurityAlert {
    type: 'new_device' | 'new_location' | 'multiple_devices' | 'ip_change' | string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    ip: string;
    location: string;
    device: string;
    timestamp: Date;
    acknowledged: boolean;
}

interface ILoginStats {
    totalLogins: number;
    failedAttempts: number;
    lastFailedLogin?: Date;
    uniqueDevices: number;
    uniqueLocations: number;
}

interface IStake {
    amount: number;
    stakedAt: Date;
    unlockDate: Date;
    lockPeriod: number;
    status: 'active' | 'completed' | 'withdrawn';
    apy: number;
    earnedRewards: number;
}

interface IAutoInvestSettings {
    enabled: boolean;
    lockPeriod: number;
    minAmount: number;
}

interface IFailedLoginAttempt {
    ip: string;
    attemptTime: Date;
    email: string;
}

interface IBlockedIP {
    ip: string;
    blockedAt: Date;
    expiresAt: Date;
    reason: string;
    attemptCount: number;
    
}

// --- Main User Interface ---

export interface IUser extends Document {
    _id: Types.ObjectId; 
    
    // Core User Info
    name: string;
    email: string;
    password: string;

    // Roles and Permissions
    isAdmin: boolean;
    role: 'user' | 'admin' | 'moderator';
    
    // Personal Details
    phone: string;
    dateOfBirth?: Date;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    profilePicture: string;
    
    // Authentication & Verification
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes: string[];
    emailVerified: boolean;
    isVerified: boolean;
    lastLogin?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    
    // 🔥 Admin OTP
    adminOTP?: string;
    adminOTPExpires?: Date;
    
    // ✅ NEW: Email OTP for User Verification
    emailOTP?: string;
    emailOTPExpiry?: Date;
    
    // Banning/Status
    isBanned: boolean;
    banned: boolean;
    banReason: string;
    bannedAt?: Date | null;
    bannedBy?: Types.ObjectId | null;
    
    // Security & Logging
    registrationIP: string;
    registrationLocation: string;
    ipAddress: string;
    currentLocation: string;
    previousIP: string;
    previousLocation: string;
    loginIPs: ILoginIP[];
    loginHistory: ILoginHistory[];
    devices: IDevice[];
    securityAlerts: ISecurityAlert[];
    securityLogs: ISecurityLog[];
    loginStats: ILoginStats;
    
    // IP Blocking Fields
    failedLoginAttempts: IFailedLoginAttempt[];
    blockedIPs: IBlockedIP[];
    
    // Referral
    referralCode?: string;
    referral?: string;
    referralCount: number;
    referredUsers: Types.ObjectId[];
    // ✅ Referral Upline Link (for commission system)
referredBy?: Types.ObjectId;

// ✅ Level-wise Incomes (for commission tracking)
level1Income?: number;
level2Income?: number;
level3Income?: number;

    // Finance/Staking
    walletBalance: number;
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    levelIncome: number;
    referralEarnings: number;
    level1: Types.ObjectId[];
    level2: Types.ObjectId[];
    level3: Types.ObjectId[];
    stakedBalance: number;
    stakes: IStake[];
    depositAmount: number;
    directCommissionGiven: boolean;
    lastCommissionDeposit: number;

    // Auto-Invest
    autoInvestEnabled: boolean;
    autoInvestSettings: IAutoInvestSettings;

    // KYC
    kycStatus: 'pending' | 'verified' | 'rejected';
    kycDocuments: string[];
    
    // Others
    walletAddress?: string;
    transactions: number;
    
    // Timestamps and Virtuals
    createdAt: Date;
    updatedAt: Date;
    referredUsersCount: number;
}

// --- Mongoose Schema Definition ---

const DeviceSchema = new Schema<IDevice>({
    name: String,
    deviceId: String,
    browser: String,
    os: String,
    lastUsed: { type: Date, default: Date.now },
    firstSeen: { type: Date, default: Date.now },
    trusted: { type: Boolean, default: false },
    ipAddress: String,
    location: String
}, { _id: false });

const StakeSchema = new Schema<IStake>({
    amount: Number,
    stakedAt: Date,
    unlockDate: Date,
    lockPeriod: Number,
    status: {
        type: String,
        enum: ['active', 'completed', 'withdrawn'],
        default: 'active',
        required: true,
    },
    apy: Number,
    earnedRewards: { type: Number, default: 0 }
}, { _id: false });

const UserSchema = new Schema<IUser>(
    {
        name: String,
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true, select: false },

        isAdmin: { type: Boolean, default: false },
        role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },

        phone: { type: String, default: "" },
        dateOfBirth: Date,
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        country: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        profilePicture: { type: String, default: "" },

        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: { type: String, select: false },
        twoFactorBackupCodes: [String],
        emailVerified: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        lastLogin: Date,
        
        resetPasswordToken: String,
        resetPasswordExpires: Date,

        // 🔥 Admin OTP Fields
        adminOTP: { 
            type: String, 
            select: false  // Hidden by default for security
        },
        adminOTPExpires: { 
            type: Date, 
            select: false 
        },

        // ✅ NEW: Email OTP Fields for User Verification
        emailOTP: { 
            type: String, 
            select: false  // Hidden by default for security
        },
        emailOTPExpiry: { 
            type: Date, 
            select: false 
        },

        isBanned: { type: Boolean, default: false },
        banned: { type: Boolean, default: false },
        banReason: { type: String, default: "" },
        bannedAt: Date,
        bannedBy: { type: Schema.Types.ObjectId, ref: "User" },

        securityLogs: [{
            type: String,
            ip: String,
            device: String,
            location: String,
            risk: Number,
            date: { type: Date, default: Date.now }
        }],
        loginIPs: [{
            ip: String,
            lastLogin: { type: Date, default: Date.now },
            count: { type: Number, default: 1 }
        }],
        registrationIP: { type: String, default: "" },
        registrationLocation: { type: String, default: "" },
        ipAddress: { type: String, default: "" },
        currentLocation: { type: String, default: "" },
        previousIP: { type: String, default: "" },
        previousLocation: { type: String, default: "" },
        
        loginHistory: [{
            ip: String,
            location: String,
            device: String,
            browser: String,
            os: String,
            timestamp: { type: Date, default: Date.now },
            suspicious: { type: Boolean, default: false }
        }],

        devices: [DeviceSchema],

        securityAlerts: [{
            type: { type: String, enum: ['new_device', 'new_location', 'multiple_devices', 'ip_change'] },
            message: String,
            severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
            ip: String,
            location: String,
            device: String,
            timestamp: { type: Date, default: Date.now },
            acknowledged: { type: Boolean, default: false }
        }],

        loginStats: {
            totalLogins: { type: Number, default: 0 },
            failedAttempts: { type: Number, default: 0 },
            lastFailedLogin: Date,
            uniqueDevices: { type: Number, default: 0 },
            uniqueLocations: { type: Number, default: 0 }
        },

        // IP Blocking Fields
        failedLoginAttempts: [{
            ip: String,
            attemptTime: { type: Date, default: Date.now },
            email: String
        }],

        blockedIPs: [{
            ip: String,
            blockedAt: { type: Date, default: Date.now },
            expiresAt: Date,
            reason: { type: String, default: "Too many failed login attempts" },
            attemptCount: { type: Number, default: 0 }
        }],

        referralCode: String,
        referral: String,
        referralCount: { type: Number, default: 0 },
        referredUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
// ✅ Upline link for commission distribution
referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

// ✅ Level wise income tracking
level1Income: { type: Number, default: 0 },
level2Income: { type: Number, default: 0 },
level3Income: { type: Number, default: 0 },

        walletBalance: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        totalDeposits: { type: Number, default: 0 },
        totalWithdrawals: { type: Number, default: 0 },
        levelIncome: { type: Number, default: 0 },
        referralEarnings: { type: Number, default: 0 },

        level1: [{ type: Schema.Types.ObjectId, ref: "User" }],
        level2: [{ type: Schema.Types.ObjectId, ref: "User" }],
        level3: [{ type: Schema.Types.ObjectId, ref: "User" }],

        stakedBalance: { type: Number, default: 0 },
        stakes: [StakeSchema],

        depositAmount: { type: Number, default: 0 },
        directCommissionGiven: { type: Boolean, default: false },
        lastCommissionDeposit: { type: Number, default: 0 },

        autoInvestEnabled: { type: Boolean, default: false },
        autoInvestSettings: {
            enabled: { type: Boolean, default: false },
            lockPeriod: { type: Number, default: 30 },
            minAmount: { type: Number, default: 100 },
        },

        kycStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        kycDocuments: [String],
        
        walletAddress: String,
        transactions: { type: Number, default: 0 },
    },
    { timestamps: true }
);

UserSchema.virtual('referredUsersCount').get(function(this: IUser) {
    return this.referredUsers?.length || 0;
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User: Model<IUser> = (mongoose.models.User || mongoose.model<IUser>("User", UserSchema)) as Model<IUser>;

export default User;