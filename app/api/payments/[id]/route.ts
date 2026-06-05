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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: true,
      }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error("GET Payment by ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // If payment is linked to an invoice, revert its effect
      if (payment.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: payment.invoiceId }
        });

        if (invoice) {
          const newPaid = Math.max(0, Number(invoice.paidAmount) - Number(payment.amount));
          const newPending = Number(invoice.totalAmount) - newPaid;
          let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";

          if (newPending <= 0) {
            newStatus = "PAID";
          } else if (newPaid > 0) {
            newStatus = "PARTIAL";
          }

          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: {
              paidAmount: newPaid,
              pendingAmount: newPending,
              status: newStatus
            }
          });
        }
      }

      await tx.payment.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Payment deleted successfully and invoice updated" });
  } catch (error: any) {
    console.error("DELETE Payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
