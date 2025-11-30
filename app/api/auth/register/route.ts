import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import { emailService } from "@/lib/email-service";

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    await connectDB();

    const { name, email, password, referral } = await req.json();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`👤 NEW USER REGISTRATION`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Referral Code Used: ${referral || 'None'}`);

    // ============================================
    // 1. VALIDATION
    // ============================================
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 400 }
      );
    }

    // ============================================
    // 2. GENERATE UNIQUE REFERRAL CODE
    // ============================================
    let referralCode = `REF${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Ensure uniqueness
    let codeExists = await User.findOne({ referralCode });
    while (codeExists) {
      referralCode = `REF${Math.floor(100000 + Math.random() * 900000)}`;
      codeExists = await User.findOne({ referralCode });
    }

    console.log(`Generated Referral Code: ${referralCode}`);

    // ============================================
    // 3. HASH PASSWORD
    // ============================================
    const hashed = await bcrypt.hash(password, 10);

    // ============================================
    // 4. FIND UPLINE USER (if referral code provided)
    // ============================================
    let uplineUser = null;
    let referredById = null;

    if (referral) {
      uplineUser = await User.findOne({ referralCode: referral });
      
      if (uplineUser) {
        referredById = uplineUser._id;
        console.log(`\n✅ Valid Referral Code - Upline Found:`);
        console.log(`   Name: ${uplineUser.name}`);
        console.log(`   Email: ${uplineUser.email}`);
      } else {
        console.log(`\n⚠️ Invalid referral code: ${referral}`);
      }
    }

    // ============================================
    // 5. CREATE NEW USER
    // ============================================
    const newUser = await User.create({
      name,
      email,
      password: hashed,
      referral,           // Upline's referral code (string)
      referralCode,       // New user's own code
      referredBy: referredById,  // ⭐ CRITICAL: Upline's user ID for commission
    });

    console.log(`\n✅ User Created: ${newUser._id}`);

    // ============================================
    // 6. UPDATE REFERRAL CHAIN (Level 1, 2, 3)
    // ============================================
    if (uplineUser) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🔗 BUILDING REFERRAL CHAIN`);
      console.log(`${'─'.repeat(60)}`);

      // ─────────────────────────────────
      // LEVEL 1 - Direct Referral
      // ─────────────────────────────────
      uplineUser.level1.push(newUser._id);
      uplineUser.referralCount += 1;
      await uplineUser.save();

      console.log(`✅ Level 1 Updated:`);
      console.log(`   User: ${uplineUser.name} (${uplineUser.email})`);
      console.log(`   Total Referrals: ${uplineUser.referralCount}`);

      // Send email to Level 1
      try {
        await emailService.sendReferralJoined(
          uplineUser.email,
          uplineUser.name || uplineUser.email,
          newUser.name,
          newUser.email,
          1
        );
        console.log(`   📧 Email sent to Level 1`);
      } catch (emailError) {
        console.error(`   ❌ Email failed for Level 1:`, emailError);
      }

      // ─────────────────────────────────
      // LEVEL 2 - If Level 1 has upline
      // ─────────────────────────────────
      if (uplineUser.referredBy) {
        const level2User = await User.findById(uplineUser.referredBy);

        if (level2User) {
          level2User.level2.push(newUser._id);
          await level2User.save();

          console.log(`✅ Level 2 Updated:`);
          console.log(`   User: ${level2User.name} (${level2User.email})`);

          // Send email to Level 2
          try {
            await emailService.sendReferralJoined(
              level2User.email,
              level2User.name || level2User.email,
              newUser.name,
              newUser.email,
              2
            );
            console.log(`   📧 Email sent to Level 2`);
          } catch (emailError) {
            console.error(`   ❌ Email failed for Level 2:`, emailError);
          }

          // ─────────────────────────────────
          // LEVEL 3 - If Level 2 has upline
          // ─────────────────────────────────
          if (level2User.referredBy) {
            const level3User = await User.findById(level2User.referredBy);

            if (level3User) {
              level3User.level3.push(newUser._id);
              await level3User.save();

              console.log(`✅ Level 3 Updated:`);
              console.log(`   User: ${level3User.name} (${level3User.email})`);

              // Send email to Level 3
              try {
                await emailService.sendReferralJoined(
                  level3User.email,
                  level3User.name || level3User.email,
                  newUser.name,
                  newUser.email,
                  3
                );
                console.log(`   📧 Email sent to Level 3`);
              } catch (emailError) {
                console.error(`   ❌ Email failed for Level 3:`, emailError);
              }
            }
          }
        }
      }

      console.log(`${'─'.repeat(60)}\n`);
    }

    // ============================================
    // 7. SEND WELCOME EMAIL TO NEW USER
    // ============================================
    try {
      await emailService.sendWelcome(
        newUser.email,
        newUser.name || newUser.email,
        newUser.referralCode
      );
      console.log(`📧 Welcome email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error(`❌ Welcome email failed:`, emailError);
    }

    // ============================================
    // 8. RETURN SUCCESS RESPONSE
    // ============================================
    const processingTime = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ REGISTRATION SUCCESSFUL`);
    console.log(`${'='.repeat(60)}`);
    console.log(`User ID: ${newUser._id}`);
    console.log(`Referral Code: ${newUser.referralCode}`);
    console.log(`Has Upline: ${uplineUser ? 'Yes' : 'No'}`);
    console.log(`Processing Time: ${processingTime}ms`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          referralCode: newUser.referralCode,
          hasUpline: !!uplineUser,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(`❌ REGISTRATION ERROR`);
    console.error(`${'='.repeat(60)}`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Stack:`, error.stack);
    console.error(`${'='.repeat(60)}\n`);

    return NextResponse.json(
      { 
        success: false, 
        message: "Server Error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}