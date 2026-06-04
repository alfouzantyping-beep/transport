import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, mobile, passport, emiratesId, license, salary, advanceBalance, visaBalance, status } = body;

    if (!name || !mobile || !license || salary === undefined) {
      return NextResponse.json({ error: "Name, Mobile, License, and Salary are required" }, { status: 400 });
    }

    try {
      const updated = await prisma.driver.update({
        where: { id },
        data: {
          name,
          mobile,
          passport: passport || "",
          emiratesId: emiratesId || "",
          license,
          salary: parseFloat(salary),
          advanceBalance: parseFloat(advanceBalance || "0"),
          visaBalance: parseFloat(visaBalance || "0"),
          status: status || "AVAILABLE",
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          salary: Number(updated.salary),
          advanceBalance: Number(updated.advanceBalance),
          visaBalance: Number(updated.visaBalance),
        },
      });
    } catch (dbError) {
      console.error("DB error updating driver:", dbError);
      return NextResponse.json({ error: "Database error updating driver" }, { status: 500 });
    }
  } catch (error) {
    console.error("Driver dynamic API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
