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
    const vehicleId = searchParams.get("vehicleId");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (vehicleId) {
      whereClause.vehicleId = vehicleId;
    }
    if (categoryId) {
      whereClause.expenseCategoryId = categoryId;
    }
    if (search) {
      whereClause.OR = [
        { description: { contains: search } },
        { referenceNo: { contains: search } },
        { vehicle: { truckNo: { contains: search } } },
        { expenseCategory: { name: { contains: search } } }
      ];
    }

    const expenses = await prisma.vehicleExpense.findMany({
      where: whereClause,
      orderBy: { expenseDate: "desc" },
      include: {
        vehicle: true,
        expenseCategory: true
      }
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("GET Vehicle Expenses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      vehicleId,
      expenseCategoryId,
      expenseDate,
      amount,
      description = "",
      referenceNo = ""
    } = body;

    // VALIDATIONS
    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle is required" }, { status: 400 });
    }
    if (!expenseCategoryId) {
      return NextResponse.json({ error: "Expense category is required" }, { status: 400 });
    }
    if (!expenseDate) {
      return NextResponse.json({ error: "Expense date is required" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const newExpense = await prisma.vehicleExpense.create({
      data: {
        vehicleId,
        expenseCategoryId,
        expenseDate: new Date(expenseDate),
        amount: parsedAmount,
        description,
        referenceNo
      },
      include: {
        vehicle: true,
        expenseCategory: true
      }
    });

    return NextResponse.json(newExpense);
  } catch (error: any) {
    console.error("POST Vehicle Expense error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
