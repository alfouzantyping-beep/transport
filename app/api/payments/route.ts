import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockPayments = [
  {
    id: "pay-1",
    customerId: "cust-3",
    customerName: "Kuwait Petroleum Corporation",
    invoiceId: "inv-1",
    invoiceNumber: "INV-2026-1001",
    amount: 13125.00,
    paymentDate: "2026-05-30T00:00:00.000Z",
    paymentMethod: "Bank Wire Transfer",
    referenceNumber: "TXN-9988102",
    notes: "Full payment settlement",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
          invoice: { select: { invoiceNumber: true } },
        }
      });

      const formatted = payments.map(p => ({
        ...p,
        amount: Number(p.amount),
        customerName: p.customer?.name || "Unknown",
        invoiceNumber: p.invoice?.invoiceNumber || "Unlinked",
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock payments.");
      return NextResponse.json({ live: false, data: mockPayments });
    }
  } catch (error) {
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
    const { customerId, invoiceId, amount, paymentDate, paymentMethod, referenceNumber, notes } = body;

    if (!customerId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const payVal = parseFloat(amount);

      const payment = await prisma.payment.create({
        data: {
          customerId,
          invoiceId: invoiceId || null,
          amount: payVal,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          referenceNumber: referenceNumber || "",
          notes: notes || "",
        },
        include: {
          customer: { select: { name: true } },
          invoice: { select: { invoiceNumber: true } },
        }
      });

      // Update the invoice paid amount if linked
      if (invoiceId) {
        const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (invoice) {
          const newPaid = Number(invoice.paidAmount) + payVal;
          const newPending = Number(invoice.totalAmount) - newPaid;
          const newStatus = newPending <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";

          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: newPaid,
              pendingAmount: newPending >= 0 ? newPending : 0,
              status: newStatus,
            }
          });
        }
      }

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...payment,
          amount: Number(payment.amount),
          customerName: payment.customer?.name || "Unknown",
          invoiceNumber: payment.invoice?.invoiceNumber || "Unlinked",
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging mock payment.");
      const mockNew = {
        id: `pay-${Date.now()}`,
        customerId,
        customerName: "Mock Customer Ltd",
        invoiceId: invoiceId || null,
        invoiceNumber: "INV-MOCK-NUM",
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        referenceNumber,
        notes,
      };
      mockPayments = [mockNew, ...mockPayments];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
