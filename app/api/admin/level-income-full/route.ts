import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    await connectDB();

    /* =========================
        ✅ ADMIN AUTH
    ========================= */
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: "No token" }, { status: 401 });
    }

   let decoded: any;
try {
  decoded = jwt.verify(token, process.env.JWT_SECRET!);
} catch (err) {
  return NextResponse.json(
    { success: false, message: "Session expired" },
    { status: 401 }
  );
}

const admin = await User.findById(decoded.id).select("isAdmin").lean();


    if (!admin?.isAdmin) {
      return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
    }

    /* =========================
       ✅ QUERY PARAMS (SEARCH + PAGINATION)
    ========================= */
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    /* =========================
        ✅ GET ALL USERS FIRST (FOR TEAM MAP)
    ========================= */
    const allUsers = await User.find({})
      .select("_id name email levelIncome")
      .lean();

    const userMap = new Map<string, any>();
    allUsers.forEach((u) => userMap.set(String(u._id), u));

    const mapTeamUsers = (ids: any[]) => {
      if (!ids || !ids.length) return [];
      return ids
        .map((id) => {
          const u = userMap.get(String(id));
          if (!u) return null;
          return {
            _id: u._id,
            name: u.name || "Unknown",
            email: u.email,
            income: Number(u.levelIncome || 0),
          };
        })
        .filter(Boolean);
    };

    /* =========================
       ✅ ULTRA-PRO MAIN QUERY
    ========================= */
    const users = await User.aggregate([
      { $match: searchFilter },

      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,

          level1: { $ifNull: ["$level1", []] },
          level2: { $ifNull: ["$level2", []] },
          level3: { $ifNull: ["$level3", []] },

          level1Income: { $ifNull: ["$level1Income", 0] },
          level2Income: { $ifNull: ["$level2Income", 0] },
          level3Income: { $ifNull: ["$level3Income", 0] },

          referralEarnings: { $ifNull: ["$referralEarnings", 0] },
          levelIncome: { $ifNull: ["$levelIncome", 0] },
        },
      },

      {
        $addFields: {
          level1Count: { $size: "$level1" },
          level2Count: { $size: "$level2" },
          level3Count: { $size: "$level3" },

          teamSize: {
            $add: [
              { $size: "$level1" },
              { $size: "$level2" },
              { $size: "$level3" },
            ],
          },

          totalEarnings: { $add: ["$levelIncome", "$referralEarnings"] },
        },
      },

      { $sort: { totalEarnings: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalUsers = await User.countDocuments(searchFilter);

    /* =========================
       ✅ FINAL FRONTEND-READY RESPONSE
    ========================= */
   return NextResponse.json({
  success: true,

  users: users.map((u: any) => ({
    user: {
      _id: u._id,
      name: u.name || "Unknown",
      email: u.email,
      createdAt: u.createdAt,
    },

    // ✅ FRONTEND COMPATIBLE (income FIELD REQUIRED)
    level1Users: mapTeamUsers(u.level1).map((x: any) => ({
      ...x,
      income: Number(x.income || 0)
    })),

    level2Users: mapTeamUsers(u.level2).map((x: any) => ({
      ...x,
      income: Number(x.income || 0)
    })),

    level3Users: mapTeamUsers(u.level3).map((x: any) => ({
      ...x,
      income: Number(x.income || 0)
    })),

    // ✅ SAFE INCOME VALUES
    level1Income: Number((u.level1Income || 0).toFixed(2)),
    level2Income: Number((u.level2Income || 0).toFixed(2)),
    level3Income: Number((u.level3Income || 0).toFixed(2)),

    level1Count: u.level1Count || 0,
    level2Count: u.level2Count || 0,
    level3Count: u.level3Count || 0,

    teamSize: u.teamSize || 0,

    levelIncome: Number((u.levelIncome || 0).toFixed(2)),
    referralEarnings: Number((u.referralEarnings || 0).toFixed(2)),
    totalEarnings: Number((u.totalEarnings || 0).toFixed(2)),
  })),

     pagination: {
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    },
  });
  
} catch (err: any) {
  console.error("❌ ULTRA-PRO LEVEL INCOME ERROR:", err);
  return NextResponse.json(
    { success: false, message: err.message },
    { status: 500 }
  );
}
}