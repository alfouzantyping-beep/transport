import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        invoices: {
          where: { status: { not: "CANCELLED" } }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        },
        openingBalances: true
      }
    });

    const aggregated = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const openingTotal = c.openingBalances.reduce((sum, opening) => sum + Number(opening.totalAmount), 0);
      const openingReceived = c.openingBalances.reduce((sum, opening) => sum + Number(opening.receivedAmount), 0);
      const openingPending = c.openingBalances.reduce((sum, opening) => sum + Number(opening.pendingAmount), 0);
      const totalReceived = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const pendingAmount = Math.max(0, totalInvoiced + openingPending - totalReceived);

      const lastPayment = c.payments[0] || null;
      const lastPaymentDate = lastPayment ? lastPayment.paymentDate : null;

      // Status determined by whether there is any outstanding balance
      let status = "PAID";
      if (pendingAmount > 0) {
        status = "OUTSTANDING";
      }

      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        paymentTerms: c.paymentTerms,
        creditLimit: Number(c.creditLimit),
        totalInvoiced: totalInvoiced + openingTotal,
        openingBalance: openingPending,
        totalReceived: totalReceived + openingReceived,
        pendingAmount,
        lastPaymentDate,
        status
      };
    });

    return NextResponse.json(aggregated);
  } catch (error: any) {
    console.error("GET Customer Pending error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
