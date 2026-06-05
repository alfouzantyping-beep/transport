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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { trip: { tripNumber: { contains: search } } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        trip: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("GET Invoices error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, vatRate = 0, notes = "", dueDate, invoiceDate } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    // Fetch trip details
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { customer: true }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Generate Invoice Number sequentially: INV-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        }
      }
    });

    const sequentialNum = String(count + 1).padStart(4, "0");
    const invoiceNumber = `INV-${currentYear}-${sequentialNum}`;

    const subtotal = Number(trip.tripAmount);
    const parsedVatRate = Number(vatRate);
    const vatAmount = (subtotal * parsedVatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(parsedInvoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice and update trip status in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          tripId,
          customerId: trip.customerId,
          invoiceDate: parsedInvoiceDate,
          dueDate: parsedDueDate,
          subtotal,
          vatRate: parsedVatRate,
          vatAmount,
          totalAmount,
          paidAmount: 0,
          pendingAmount: totalAmount,
          status: "UNPAID",
          notes,
        },
        include: {
          customer: true,
          trip: true
        }
      });

      await tx.trip.update({
        where: { id: tripId },
        data: { status: "INVOICED" }
      });

      return newInvoice;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST Invoice error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
