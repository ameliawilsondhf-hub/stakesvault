import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Deposit from "@/lib/models/deposit";
import User from "@/lib/models/user";
import { emailService } from "@/lib/email-service";

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
    // 1. AUTHENTICATION & AUTHORIZATION
    // ============================================
    const isDevelopment = process.env.NODE_ENV === 'development';
    let adminId = null;
    let adminEmail = null;

    if (!isDevelopment) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        return NextResponse.json(
          { 
            success: false,
            message: "Authentication required. Please login to continue." 
          },
          { status: 401 }
        );
      }

    const admin = await User.findOne({ email: session.user.email }).select('_id email isAdmin');

// ✅ FIXED: Check only isAdmin field
if (!admin || admin.isAdmin !== true) {
  console.warn(`⚠️ Unauthorized deposit approve attempt by: ${session.user.email}`);
  console.warn(`   Admin object:`, { id: admin?._id, email: admin?.email, isAdmin: admin?.isAdmin });
  return NextResponse.json(
    { 
      success: false,
      message: "Admin privileges required to perform this action." 
    },
    { status: 403 }
  );
}
      
      adminId = admin._id;
      adminEmail = admin.email;
    } else {
      // Development mode - attempt to get admin but don't block
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const admin = await User.findOne({ email: session.user.email }).select('_id email');
          if (admin) {
            adminId = admin._id;
            adminEmail = admin.email;
          }
        }
      } catch (err) {
        console.log("⚠️ Development mode: Proceeding without admin authentication");
      }
    }

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
    console.log(`Admin: ${adminEmail || 'Development Mode'}`);
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
    if (adminId) {
      deposit.approvedBy = adminId;
    }
    
    await deposit.save();

    console.log(`✅ Deposit status updated to: APPROVED\n`);

    // ============================================
    // 8. REFERRAL COMMISSION DISTRIBUTION
    // Commission Structure: $5, $2.5, $1.25 per $50
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
      console.log(`Upline User ID: ${user.referredBy}`);
      console.log(`Commission Structure: $5, $2.5, $1.25 per $50\n`);

      // ⭐ OPTIMIZATION: Calculate slabs once
      const completedSlabs = Math.floor(depositAmount / 50);

      // ⭐ SAFETY GUARD: Skip if deposit below $50
      if (completedSlabs === 0) {
        console.log(`ℹ️ Commission skipped: Deposit below $50 threshold (slabs = 0)\n`);
        console.log(`${'='.repeat(60)}\n`);
      } else {
        console.log(`✅ Qualified for commission: ${completedSlabs} complete slabs\n`);

        try {
          // ────────────────────────────────────────
          // LEVEL 1 - $5 per $50 slab
          // ────────────────────────────────────────
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
          
          console.log(`✅ Level 1 Commission Distributed:`);
          console.log(`   User: ${level1User.name} (${level1User.email})`);
          console.log(`   Slabs: ${completedSlabs} complete $50 slabs`);
          console.log(`   Amount: $${commission1.toFixed(2)} (${completedSlabs} × $5)`);
          console.log(`   Calculation: floor($${depositAmount}/$50) = ${completedSlabs} slabs → ${completedSlabs} × $5 = $${commission1.toFixed(2)}`);
          console.log(`   New Balance: $${level1User.walletBalance.toFixed(2)}\n`);

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
            console.log(`   📧 Commission email sent successfully\n`);
          } catch (emailError) {
            console.error(`   ❌ Email notification failed:`, emailError);
          }

          // ────────────────────────────────────────
          // LEVEL 2 - $2.5 per $50 slab
          // ────────────────────────────────────────
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
              
              console.log(`✅ Level 2 Commission Distributed:`);
              console.log(`   User: ${level2User.name} (${level2User.email})`);
              console.log(`   Slabs: ${completedSlabs} complete $50 slabs`);
              console.log(`   Amount: $${commission2.toFixed(2)} (${completedSlabs} × $2.5)`);
              console.log(`   Calculation: floor($${depositAmount}/$50) = ${completedSlabs} slabs → ${completedSlabs} × $2.5 = $${commission2.toFixed(2)}`);
              console.log(`   New Balance: $${level2User.walletBalance.toFixed(2)}\n`);

              // Send email notification
              try {
                await emailService.sendCommissionEarned(
                  level2User.email,
                  level2User.name || level2User.email,
                  commission2,
                  user.name || user.email,
                  2,
                  "First Deposit Commission"
                );
                console.log(`   📧 Commission email sent successfully\n`);
              } catch (emailError) {
                console.error(`   ❌ Email notification failed:`, emailError);
              }

              // ────────────────────────────────────────
              // LEVEL 3 - $1.25 per $50 slab
              // ────────────────────────────────────────
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
                  
                  console.log(`✅ Level 3 Commission Distributed:`);
                  console.log(`   User: ${level3User.name} (${level3User.email})`);
                  console.log(`   Slabs: ${completedSlabs} complete $50 slabs`);
                  console.log(`   Amount: $${commission3.toFixed(2)} (${completedSlabs} × $1.25)`);
                  console.log(`   Calculation: floor($${depositAmount}/$50) = ${completedSlabs} slabs → ${completedSlabs} × $1.25 = $${commission3.toFixed(2)}`);
                  console.log(`   New Balance: $${level3User.walletBalance.toFixed(2)}\n`);

                  // Send email notification
                  try {
                    await emailService.sendCommissionEarned(
                      level3User.email,
                      level3User.name || level3User.email,
                      commission3,
                      user.name || user.email,
                      3,
                      "First Deposit Commission"
                    );
                    console.log(`   📧 Commission email sent successfully\n`);
                  } catch (emailError) {
                    console.error(`   ❌ Email notification failed:`, emailError);
                  }
                } else {
                  console.log(`   ℹ️ Level 3 user not found\n`);
                }
              } else {
                console.log(`   ℹ️ Level 2 user has no upline\n`);
              }
            } else {
              console.log(`   ℹ️ Level 2 user not found\n`);
            }
          } else {
            console.log(`   ℹ️ Level 1 user has no upline\n`);
          }
          
          console.log(`${'─'.repeat(60)}`);
          console.log(`💰 Total Commission Distributed: $${commissionsDistributed.totalCommission.toFixed(2)}`);
          console.log(`   Breakdown: L1=$${commissionsDistributed.level1?.commission.toFixed(2) || '0'}, L2=$${commissionsDistributed.level2?.commission.toFixed(2) || '0'}, L3=$${commissionsDistributed.level3?.commission.toFixed(2) || '0'}`);
          console.log(`${'='.repeat(60)}\n`);
          
        } else {
          console.log(`⚠️ Level 1 user not found with ID: ${user.referredBy}\n`);
        }
      } catch (commissionError: any) {
        console.error(`❌ Commission distribution error:`, commissionError);
        // Don't fail the deposit approval if commission fails
      }
      } // ⭐ Closing brace for safety guard
    } else {
      if (!isFirstDeposit) {
        console.log(`ℹ️ Commission skipped: Not the first deposit\n`);
      } else if (!user.referredBy) {
        console.log(`ℹ️ Commission skipped: User has no referral upline\n`);
      }
    }

    // ============================================
    // 9. SEND DEPOSIT APPROVAL EMAIL TO USER
    // ============================================
    try {
      await emailService.sendDepositApproved(
        user.email,
        user.name || user.email.split('@')[0],
        depositAmount,
        user.walletBalance,
        deposit._id.toString()
      );
      console.log(`📧 Deposit approval email sent to: ${user.email}\n`);
    } catch (emailError) {
      console.error(`❌ Deposit approval email failed:`, emailError);
    }

    // ============================================
    // 10. PREPARE RESPONSE
    // ============================================
    const processingTime = Date.now() - startTime;
    
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ DEPOSIT APPROVAL COMPLETED`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Processing Time: ${processingTime}ms`);
    console.log(`Deposit ID: ${deposit._id}`);
    console.log(`Amount: $${depositAmount.toFixed(2)}`);
    console.log(`User Balance: $${user.walletBalance.toFixed(2)}`);
    console.log(`Commissions: $${commissionsDistributed.totalCommission.toFixed(2)}`);
    console.log(`${'='.repeat(60)}\n`);

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
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ DEPOSIT APPROVAL ERROR`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Stack Trace:`, error.stack);
    console.error(`${'='.repeat(60)}\n`);

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