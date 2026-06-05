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
    const customerId = searchParams.get("customerId");
    const invoiceId = searchParams.get("invoiceId");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    }
    if (invoiceId) {
      whereClause.invoiceId = invoiceId;
    }
    if (search) {
      whereClause.OR = [
        { referenceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { invoice: { invoiceNumber: { contains: search } } }
      ];
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { paymentDate: "desc" },
      include: {
        customer: true,
        invoice: true,
      },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("GET Payments error:", error);
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
    const { customerId, invoiceId, amount, paymentDate, paymentMethod, referenceNo, notes = "" } = body;

    if (!customerId || amount === undefined || !paymentDate || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payVal = Number(amount);
    if (isNaN(payVal) || payVal <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId,
          invoiceId: invoiceId || null,
          amount: payVal,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          referenceNo: referenceNo || "",
          notes,
        },
        include: {
          customer: true,
          invoice: true
        }
      });

      if (invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId }
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }

        const newPaid = Number(invoice.paidAmount) + payVal;
        const newPending = Number(invoice.totalAmount) - newPaid;
        let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";

        if (newPending <= 0) {
          newStatus = "PAID";
        } else if (newPaid > 0) {
          newStatus = "PARTIAL";
        }

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmount: newPaid,
            pendingAmount: newPending >= 0 ? newPending : 0,
            status: newStatus
          }
        });
      }

      return payment;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Payment error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
