import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";
import { headers } from "next/headers";

/**
 * POST /api/admin/deposit/approve
 * 
 * Approve a pending deposit request
 * Features:
 * - Updates user wallet balance
 * - Distributes referral commissions (first deposit only)
 * - Commission Structure: $5, $2.5, $1.25 per $50 deposit
 * - Sends email notifications to all parties
 * - Tracks admin actions
 * 
 * @requires Admin authentication
 * @body { requestId: string }
 * @returns { success, message, data }
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();

    // ============================================
    // 1. AUTHENTICATION & AUTHORIZATION (FIXED)
    // ============================================
    const isDevelopment = process.env.NODE_ENV === 'development';
    let adminId = null;
    let adminEmail = null;

    // ✅ FIX: Get session with proper cookie handling
    const session = await getServerSession(authOptions);
    
    // ✅ DEBUG: Log session for troubleshooting
    console.log("🔍 Session Debug:", {
      hasSession: !!session,
      email: session?.user?.email,
      env: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    });

    if (!session?.user?.email) {
      console.error("❌ No session found or email missing");
      return NextResponse.json(
        { 
          success: false,
          message: "Authentication required. Please login again.",
          debug: isDevelopment ? {
            hasSession: !!session,
            email: session?.user?.email
          } : undefined
        },
        { status: 401 }
      );
    }

    // ✅ FIX: Find admin user with better error handling
    const admin = await User.findOne({ 
      email: session.user.email 
    }).select('_id email isAdmin name').lean();

    console.log("🔍 Admin Check:", {
      email: session.user.email,
      found: !!admin,
      isAdmin: admin?.isAdmin
    });

    if (!admin) {
      console.error("❌ Admin user not found in database");
      return NextResponse.json(
        { 
          success: false,
          message: "User account not found. Please contact support.",
          debug: isDevelopment ? {
            email: session.user.email,
            userFound: false
          } : undefined
        },
        { status: 404 }
      );
    }

    // ✅ FIX: Strict admin check with proper logging
    if (admin.isAdmin !== true) {
      console.warn("⚠️ Non-admin user attempted access:", {
        email: admin.email,
        isAdmin: admin.isAdmin
      });

      return NextResponse.json(
        { 
          success: false,
          message: "Admin privileges required to perform this action.",
          debug: isDevelopment ? {
            isAdmin: admin.isAdmin,
            email: admin.email
          } : undefined
        },
        { status: 403 }
      );
    }

    adminId = admin._id;
    adminEmail = admin.email;

    console.log("✅ Admin authenticated:", adminEmail);

    // ============================================
    // 2. REQUEST VALIDATION
    // ============================================
    const body = await req.json();
    const { requestId } = body;
    
    if (!requestId) {
      return NextResponse.json(
        { 
          success: false,
          message: "Deposit request ID is required." 
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. FETCH & VALIDATE DEPOSIT
    // ============================================
    const deposit = await Deposit.findById(requestId);

    if (!deposit) {
      return NextResponse.json(
        { 
          success: false,
          message: "Deposit request not found." 
        },
        { status: 404 }
      );
    }

    if (deposit.status !== "pending") {
      return NextResponse.json(
        { 
          success: false,
          message: `This deposit has already been ${deposit.status}.`,
          currentStatus: deposit.status
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. FETCH USER
    // ============================================
    const user = await User.findById(deposit.userId);

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          message: "User associated with this deposit not found." 
        },
        { status: 404 }
      );
    }

    // ============================================
    // 5. CHECK IF FIRST DEPOSIT
    // ============================================
    const previousApprovedDeposits = await Deposit.countDocuments({
      userId: user._id,
      status: "approved"
    });

    const isFirstDeposit = previousApprovedDeposits === 0;
    const depositAmount = deposit.amount;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📥 DEPOSIT APPROVAL INITIATED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Deposit ID: ${deposit._id}`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Amount: $${depositAmount.toFixed(2)}`);
    console.log(`First Deposit: ${isFirstDeposit ? 'Yes ✓' : 'No'}`);
    console.log(`Has Upline: ${user.referredBy ? 'Yes ✓' : 'No'}`);
    console.log(`Admin: ${adminEmail}`);
    console.log(`${'='.repeat(60)}\n`);

    // ============================================
    // 6. UPDATE USER BALANCE
    // ============================================
    const previousBalance = user.walletBalance;
    user.walletBalance += depositAmount;
    user.totalDeposits = (user.totalDeposits || 0) + depositAmount;
    
    await user.save();

    console.log(`💰 Balance Updated:`);
    console.log(`   Previous: $${previousBalance.toFixed(2)}`);
    console.log(`   Added: $${depositAmount.toFixed(2)}`);
    console.log(`   New: $${user.walletBalance.toFixed(2)}\n`);

    // ============================================
    // 7. UPDATE DEPOSIT STATUS
    // ============================================
    deposit.status = "approved";
    deposit.approvedAt = new Date();
    deposit.approvedBy = adminId;
    
    await deposit.save();

    console.log(`✅ Deposit status updated to: APPROVED\n`);

    // ============================================
    // 8. REFERRAL COMMISSION DISTRIBUTION
    // ============================================
    let commissionsDistributed = {
      level1: null as any,
      level2: null as any,
      level3: null as any,
      totalCommission: 0
    };

    if (isFirstDeposit && user.referredBy) {
      console.log(`${'='.repeat(60)}`);
      console.log(`💎 COMMISSION DISTRIBUTION (First Deposit)`);
      console.log(`${'='.repeat(60)}`);

      const completedSlabs = Math.floor(depositAmount / 50);

      if (completedSlabs === 0) {
        console.log(`ℹ️ Commission skipped: Deposit below $50 threshold\n`);
      } else {
        console.log(`✅ Qualified: ${completedSlabs} complete slabs\n`);

        try {
          // Level 1 - $5 per $50 slab
          const level1User = await User.findById(user.referredBy);
          
          if (level1User) {
            const commission1 = completedSlabs * 5;
          
            level1User.walletBalance += commission1;
            level1User.referralEarnings = (level1User.referralEarnings || 0) + commission1;
            level1User.levelIncome = (level1User.levelIncome || 0) + commission1;
            
            await level1User.save();
            
            commissionsDistributed.level1 = {
              userId: level1User._id,
              name: level1User.name,
              email: level1User.email,
              commission: commission1
            };
            commissionsDistributed.totalCommission += commission1;
            
            console.log(`✅ Level 1: $${commission1.toFixed(2)} → ${level1User.name}`);

            // Send email notification
            try {
              await emailService.sendCommissionEarned(
                level1User.email,
                level1User.name || level1User.email,
                commission1,
                user.name || user.email,
                1,
                "First Deposit Commission"
              );
            } catch (emailError) {
              console.error(`❌ Email failed:`, emailError);
            }

            // Level 2 - $2.5 per $50 slab
            if (level1User.referredBy) {
              const level2User = await User.findById(level1User.referredBy);
              
              if (level2User) {
                const commission2 = completedSlabs * 2.5;
                
                level2User.walletBalance += commission2;
                level2User.referralEarnings = (level2User.referralEarnings || 0) + commission2;
                level2User.levelIncome = (level2User.levelIncome || 0) + commission2;
                
                await level2User.save();
                
                commissionsDistributed.level2 = {
                  userId: level2User._id,
                  name: level2User.name,
                  email: level2User.email,
                  commission: commission2
                };
                commissionsDistributed.totalCommission += commission2;
                
                console.log(`✅ Level 2: $${commission2.toFixed(2)} → ${level2User.name}`);

                try {
                  await emailService.sendCommissionEarned(
                    level2User.email,
                    level2User.name || level2User.email,
                    commission2,
                    user.name || user.email,
                    2,
                    "First Deposit Commission"
                  );
                } catch (emailError) {
                  console.error(`❌ Email failed:`, emailError);
                }

                // Level 3 - $1.25 per $50 slab
                if (level2User.referredBy) {
                  const level3User = await User.findById(level2User.referredBy);
                  
                  if (level3User) {
                    const commission3 = completedSlabs * 1.25;
                    
                    level3User.walletBalance += commission3;
                    level3User.referralEarnings = (level3User.referralEarnings || 0) + commission3;
                    level3User.levelIncome = (level3User.levelIncome || 0) + commission3;
                    
                    await level3User.save();
                    
                    commissionsDistributed.level3 = {
                      userId: level3User._id,
                      name: level3User.name,
                      email: level3User.email,
                      commission: commission3
                    };
                    commissionsDistributed.totalCommission += commission3;
                    
                    console.log(`✅ Level 3: $${commission3.toFixed(2)} → ${level3User.name}`);

                    try {
                      await emailService.sendCommissionEarned(
                        level3User.email,
                        level3User.name || level3User.email,
                        commission3,
                        user.name || user.email,
                        3,
                        "First Deposit Commission"
                      );
                    } catch (emailError) {
                      console.error(`❌ Email failed:`, emailError);
                    }
                  }
                }
              }
            }
          }
          
          console.log(`💰 Total Commission: $${commissionsDistributed.totalCommission.toFixed(2)}\n`);
          
        } catch (commissionError: any) {
          console.error(`❌ Commission error:`, commissionError);
        }
      }
    }

    // ============================================
    // 9. SEND DEPOSIT APPROVAL EMAIL
    // ============================================
    try {
      await emailService.sendDepositApproved(
        user.email,
        user.name || user.email.split('@')[0],
        depositAmount,
        user.walletBalance,
        deposit._id.toString()
      );
      console.log(`📧 Email sent to: ${user.email}\n`);
    } catch (emailError) {
      console.error(`❌ Email failed:`, emailError);
    }

    // ============================================
    // 10. RESPONSE
    // ============================================
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ COMPLETED in ${processingTime}ms\n`);

    return NextResponse.json({
      success: true,
      message: "Deposit approved successfully!",
      data: {
        depositId: deposit._id,
        amount: depositAmount,
        previousBalance: previousBalance,
        newBalance: user.walletBalance,
        isFirstDeposit,
        commissionsDistributed: isFirstDeposit && user.referredBy ? commissionsDistributed : null,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error(`❌ ERROR:`, error);

    return NextResponse.json(
      { 
        success: false,
        message: "An error occurred while processing the deposit approval.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}