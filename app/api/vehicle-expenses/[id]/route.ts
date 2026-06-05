import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.vehicleExpense.findUnique({
      where: { id },
      include: {
        vehicle: true,
        expenseCategory: true
      }
    });

    if (!expense) {
      return NextResponse.json({ error: "Vehicle expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("GET Vehicle Expense by ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      vehicleId,
      expenseCategoryId,
      expenseDate,
      amount,
      description,
      referenceNo
    } = body;

    const expense = await prisma.vehicleExpense.findUnique({
      where: { id }
    });

    if (!expense) {
      return NextResponse.json({ error: "Vehicle expense not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (vehicleId !== undefined) {
      if (!vehicleId) {
        return NextResponse.json({ error: "Vehicle is required" }, { status: 400 });
      }
      updateData.vehicleId = vehicleId;
    }

    if (expenseCategoryId !== undefined) {
      if (!expenseCategoryId) {
        return NextResponse.json({ error: "Expense category is required" }, { status: 400 });
      }
      updateData.expenseCategoryId = expenseCategoryId;
    }

    if (expenseDate !== undefined) {
      if (!expenseDate) {
        return NextResponse.json({ error: "Expense date is required" }, { status: 400 });
      }
      updateData.expenseDate = new Date(expenseDate);
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      }
      updateData.amount = parsedAmount;
    }

    if (description !== undefined) updateData.description = description;
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo;

    const updatedExpense = await prisma.vehicleExpense.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        expenseCategory: true
      }
    });

    return NextResponse.json(updatedExpense);
  } catch (error: any) {
    console.error("PUT Vehicle Expense error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const expense = await prisma.vehicleExpense.findUnique({
      where: { id }
    });

    if (!expense) {
      return NextResponse.json({ error: "Vehicle expense not found" }, { status: 404 });
    }

    await prisma.vehicleExpense.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Vehicle expense deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Vehicle Expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
