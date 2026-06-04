import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockInvoices = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-1001",
    tripId: "trip-3",
    tripNumber: "TRIP-2026-003",
    customerName: "Kuwait Petroleum Corporation",
    invoiceDate: "2026-05-29T00:00:00.000Z",
    dueDate: "2026-06-29T00:00:00.000Z",
    amount: 12500.00,
    vatAmount: 625.00, // 5% VAT
    totalAmount: 13125.00,
    paidAmount: 13125.00,
    pendingAmount: 0.00,
    status: "PAID",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          trip: {
            select: {
              tripNumber: true,
              customer: { select: { name: true } },
            }
          }
        }
      });

      const formatted = invoices.map(i => ({
        ...i,
        amount: Number(i.amount),
        vatAmount: Number(i.vatAmount),
        totalAmount: Number(i.totalAmount),
        paidAmount: Number(i.paidAmount),
        pendingAmount: Number(i.pendingAmount),
        tripNumber: i.trip?.tripNumber || "Unknown",
        customerName: i.trip?.customer?.name || "Unknown",
      }));

      return NextResponse.json({ live: true, data: formatted });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock invoices.");
      return NextResponse.json({ live: false, data: mockInvoices });
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
    const { tripId, applyVat } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Fetch trip details
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { customer: true }
      });

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      const amount = Number(trip.tripAmount);
      const vatAmount = applyVat ? amount * 0.05 : 0.00;
      const totalAmount = amount + vatAmount;

      const newInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          tripId,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30 default
          amount,
          vatAmount,
          totalAmount,
          paidAmount: 0.00,
          pendingAmount: totalAmount,
          status: "UNPAID",
        },
        include: {
          trip: {
            select: {
              tripNumber: true,
              customer: { select: { name: true } },
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...newInvoice,
          amount: Number(newInvoice.amount),
          vatAmount: Number(newInvoice.vatAmount),
          totalAmount: Number(newInvoice.totalAmount),
          paidAmount: Number(newInvoice.paidAmount),
          pendingAmount: Number(newInvoice.pendingAmount),
          tripNumber: newInvoice.trip?.tripNumber || "Unknown",
          customerName: newInvoice.trip?.customer?.name || "Unknown",
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, logging mock invoice.");
      const mockNew = {
        id: `inv-${Date.now()}`,
        invoiceNumber: invNum,
        tripId,
        tripNumber: "TRIP-MOCK-NUM",
        customerName: "Mock Customer Ltd",
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 8000.00,
        vatAmount: applyVat ? 400.00 : 0.00,
        totalAmount: applyVat ? 8400.00 : 8000.00,
        paidAmount: 0.00,
        pendingAmount: applyVat ? 8400.00 : 8000.00,
        status: "UNPAID",
      };
      mockInvoices = [mockNew, ...mockInvoices];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
