import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Temporary in-memory fallback list for demo mode
let mockCustomers = [
  {
    id: "cust-1",
    name: "Almarai Company",
    contactPerson: "Ali Al-Harbi",
    trn: "300456123400003",
    paymentTerms: "Net 30",
    phone: "+966 50 123 4567",
    email: "logistics@almarai.com",
    address: "Riyadh, Saudi Arabia",
  },
  {
    id: "cust-2",
    name: "Emaar Properties PJSC",
    contactPerson: "Sarah Al-Mansoori",
    trn: "100123987600003",
    paymentTerms: "COD",
    phone: "+971 4 367 3333",
    email: "procurement@emaar.ae",
    address: "Downtown Dubai, UAE",
  },
  {
    id: "cust-3",
    name: "Kuwait Petroleum Corporation",
    contactPerson: "Fahad Al-Sabah",
    trn: "400192837400003",
    paymentTerms: "Net 60",
    phone: "+965 2499 1000",
    email: "supply@kpc.com.kw",
    address: "Kuwait City, Kuwait",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const customers = await prisma.customer.findMany({
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ live: true, data: customers });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock customers.");
      return NextResponse.json({ live: false, data: mockCustomers });
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
    const { name, contactPerson, trn, paymentTerms, phone, email, address } = body;

    if (!name || !contactPerson || !trn) {
      return NextResponse.json({ error: "Name, Contact Person, and TRN are required" }, { status: 400 });
    }

    try {
      const newCustomer = await prisma.customer.create({
        data: { name, contactPerson, trn, paymentTerms, phone, email, address },
      });
      return NextResponse.json({ success: true, live: true, data: newCustomer });
    } catch (dbError) {
      console.warn("Database connection failed, adding to mock memory.");
      const mockNew = {
        id: `cust-${Date.now()}`,
        name,
        contactPerson,
        trn,
        paymentTerms,
        phone,
        email,
        address
      };
      mockCustomers = [mockNew, ...mockCustomers];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
