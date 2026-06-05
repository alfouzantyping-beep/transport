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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        trip: {
          include: {
            driver: true,
            vehicle: true,
          }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("GET Invoice by ID error:", error);
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
    const { status, notes, dueDate, vatRate, subtotal } = body;

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    // If subtotal or vatRate is updated, recompute totals
    if (subtotal !== undefined || vatRate !== undefined) {
      const newSubtotal = subtotal !== undefined ? Number(subtotal) : invoice.subtotal;
      const newVatRate = vatRate !== undefined ? Number(vatRate) : invoice.vatRate;
      const newVatAmount = (newSubtotal * newVatRate) / 100;
      const newTotalAmount = newSubtotal + newVatAmount;

      updateData.subtotal = newSubtotal;
      updateData.vatRate = newVatRate;
      updateData.vatAmount = newVatAmount;
      updateData.totalAmount = newTotalAmount;
      updateData.pendingAmount = newTotalAmount - invoice.paidAmount;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        trip: true
      }
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("PUT Invoice error:", error);
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

    const invoice = await prisma.invoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Reset trip status back to CLOSED and delete invoice
    await prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: invoice.tripId },
        data: { status: "CLOSED" }
      });

      await tx.invoice.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Invoice deleted successfully and trip status reset to CLOSED" });
  } catch (error: any) {
    console.error("DELETE Invoice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
