// Force clean recompile
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ReceiptData } from '@/features/receipts/components/ReceiptPDF';
import { generateReceiptBuffer } from '@/features/receipts/utils/renderPdf';

// Force Node.js runtime for @react-pdf/renderer compatibility
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ receiptId: string }> }
) {
  try {
    const resolvedParams = await params;
    const receiptId = resolvedParams.receiptId;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, house_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new NextResponse('Profile not found', { status: 403 });
    }

    // Fetch the immutable receipt snapshot
    // Uses service role intentionally to bypass RLS for this specific read if needed? 
    // Wait, receipts has SELECT policy? Let's use the authenticated client. If RLS blocks it, it's safer.
    // However, in the TRD it says: "Residents have SELECT-only on receipts". So RLS should allow it.
    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .single();

    if (error || !receipt) {
      return new NextResponse('Receipt not found', { status: 404 });
    }

    // Strict access control: Residents can only access receipts tied to their house
    if (profile.role === 'resident' && profile.house_id !== receipt.house_id) {
      // Audit log the unauthorized access attempt could go here
      return new NextResponse('Forbidden Access', { status: 403 });
    }

    // Render PDF Buffer using the helper
    const pdfBuffer = await generateReceiptBuffer(receipt.receipt_data as ReceiptData);

    // Return as PDF Response
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${receipt.receipt_number}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('[Receipt PDF Route Error]', error);
    return new NextResponse(`Internal Server Error generating PDF: ${error?.message}`, { status: 500 });
  }
}
