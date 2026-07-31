import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isStaff, canManageFinance } from "@/lib/permissions";

const json = (b: unknown, s = 200) => NextResponse.json(b, { status: s });
const bad = (m: string, s = 400) => json({ message: m }, s);

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!isStaff(user)) return bad("Forbidden", 403);
  const view = req.nextUrl.searchParams.get("view") || "invoices";
  const studentId = req.nextUrl.searchParams.get("studentId");

  if (view === "feeTypes") {
    return json(await prisma.feeType.findMany({ orderBy: { name: "asc" } }));
  }
  if (view === "report") {
    const invoices = await prisma.invoice.findMany({ where: { status: { not: "VOID" } }, include: { payments: true } });
    let issued = 0, paid = 0, outstanding = 0;
    const byFee: Record<string, number> = {};
    for (const inv of invoices) {
      issued += inv.total; paid += inv.amountPaid; outstanding += Math.max(0, inv.total - inv.amountPaid);
      for (const it of (inv as any).items || []) {}
    }
    const items = await prisma.invoiceItem.findMany({ where: { invoice: { status: { not: "VOID" } } } });
    for (const it of items) byFee[it.description] = (byFee[it.description] || 0) + it.total;
    return json({ issued, paid, outstanding, byFee, invoiceCount: invoices.length });
  }
  // invoices
  const invoices = await prisma.invoice.findMany({
    where: studentId ? { studentId } : {},
    include: { student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }, items: true, payments: { orderBy: { paidAt: "desc" } } },
    orderBy: { issueDate: "desc" },
  });
  return json(invoices);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!canManageFinance(user)) return bad("Forbidden", 403);
  const body = await req.json().catch(() => ({}));
  const who = `${user.firstName} ${user.lastName}`;
  try {
    if (body.kind === "feeType") {
      const r = await prisma.feeType.create({ data: { name: body.name, amount: Number(body.amount) || 0, description: body.description } });
      return json(r, 201);
    }
    if (body.kind === "invoice") {
      const items: { description: string; quantity: number; unitPrice: number }[] = body.items || [];
      if (!items.length) return bad("Add at least one line item");
      const subtotal = items.reduce((a, it) => a + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
      const y = new Date().getFullYear();
      const count = await prisma.invoice.count();
      const number = `INV-${y}-${String(count + 1).padStart(4, "0")}`;
      const r = await prisma.invoice.create({
        data: {
          number, studentId: body.studentId, dueDate: body.dueDate ? new Date(body.dueDate) : null,
          subtotal, total: subtotal, notes: body.notes, createdById: user.id, createdByName: who,
          items: { create: items.map((it) => ({ description: it.description, quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) || 0, total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0) })) },
        },
        include: { items: true },
      });
      return json(r, 201);
    }
    if (body.kind === "payment") {
      const inv = await prisma.invoice.findUnique({ where: { id: body.invoiceId } });
      if (!inv) return bad("Invoice not found", 404);
      const amount = Number(body.amount) || 0;
      if (amount <= 0) return bad("Amount must be positive");
      await prisma.payment.create({ data: { invoiceId: inv.id, amount, method: body.method || "CASH", reference: body.reference, receivedById: user.id, receivedByName: who, notes: body.notes } });
      const paid = inv.amountPaid + amount;
      const status = paid >= inv.total ? "PAID" : "PARTIALLY_PAID";
      const r = await prisma.invoice.update({ where: { id: inv.id }, data: { amountPaid: paid, status } });
      return json(r);
    }
    if (body.kind === "void") {
      const r = await prisma.invoice.update({ where: { id: body.invoiceId }, data: { status: "VOID" } });
      return json(r);
    }
    return bad("Unknown kind");
  } catch (e: any) {
    return bad(e.message || "Failed", 500);
  }
}