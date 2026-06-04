import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

let mockDrivers = [
  {
    id: "drv-1",
    name: "Muhammad Khan",
    mobile: "+971 52 345 6789",
    passport: "N87654321",
    emiratesId: "784-1990-1234567-1",
    license: "Heavy Truck - L-90812A",
    salary: 4500.00,
    advanceBalance: 350.00,
    visaBalance: 0.00,
    status: "AVAILABLE",
  },
  {
    id: "drv-2",
    name: "Amrit Singh",
    mobile: "+971 50 987 6543",
    passport: "Z98765432",
    emiratesId: "784-1988-7654321-2",
    license: "Heavy Truck - L-12345B",
    salary: 4000.00,
    advanceBalance: 0.00,
    visaBalance: 1200.00,
    status: "ACTIVE",
  },
  {
    id: "drv-3",
    name: "Sajid Khan",
    mobile: "+971 55 543 2109",
    passport: "P77665544",
    emiratesId: "784-1992-8877665-3",
    license: "Heavy Tanker - L-76543C",
    salary: 5000.00,
    advanceBalance: 150.00,
    visaBalance: 0.00,
    status: "OFF_DUTY",
  }
];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const drivers = await prisma.driver.findMany({
        orderBy: { name: "asc" },
      });
      // Convert Decimal instances to standard numbers
      const formattedDrivers = drivers.map(d => ({
        ...d,
        salary: Number(d.salary),
        advanceBalance: Number(d.advanceBalance),
        visaBalance: Number(d.visaBalance),
      }));
      return NextResponse.json({ live: true, data: formattedDrivers });
    } catch (dbError) {
      console.warn("Database connection failed, returning mock drivers.");
      return NextResponse.json({ live: false, data: mockDrivers });
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
    const { name, mobile, passport, emiratesId, license, salary, advanceBalance, visaBalance, status } = body;

    if (!name || !mobile || !license || !salary) {
      return NextResponse.json({ error: "Name, Mobile, License, and Salary are required" }, { status: 400 });
    }

    try {
      const newDriver = await prisma.driver.create({
        data: {
          name,
          mobile,
          passport: passport || "",
          emiratesId: emiratesId || "",
          license,
          salary: parseFloat(salary),
          advanceBalance: parseFloat(advanceBalance || 0),
          visaBalance: parseFloat(visaBalance || 0),
          status: status || "AVAILABLE"
        },
      });
      return NextResponse.json({
        success: true,
        live: true,
        data: {
          ...newDriver,
          salary: Number(newDriver.salary),
          advanceBalance: Number(newDriver.advanceBalance),
          visaBalance: Number(newDriver.visaBalance)
        }
      });
    } catch (dbError) {
      console.warn("Database connection failed, adding to mock memory.");
      const mockNew = {
        id: `drv-${Date.now()}`,
        name,
        mobile,
        passport,
        emiratesId,
        license,
        salary: parseFloat(salary),
        advanceBalance: parseFloat(advanceBalance || 0),
        visaBalance: parseFloat(visaBalance || 0),
        status: status || "AVAILABLE"
      };
      mockDrivers = [mockNew, ...mockDrivers];
      return NextResponse.json({ success: true, live: false, data: mockNew });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
