import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = {
      status: "ACTIVE"
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET Expense Categories API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
