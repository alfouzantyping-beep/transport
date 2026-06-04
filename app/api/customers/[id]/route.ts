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
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, contactPerson, trn, paymentTerms, phone, email, address } = body;

    if (!name || !contactPerson || !trn || !paymentTerms || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      const updated = await prisma.customer.update({
        where: { id },
        data: {
          name,
          contactPerson,
          trn,
          paymentTerms,
          phone,
          email,
          address: address || "",
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } catch (dbError) {
      console.error("DB error updating customer:", dbError);
      return NextResponse.json({ error: "Database error updating customer" }, { status: 500 });
    }
  } catch (error) {
    console.error("Customer dynamic API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
