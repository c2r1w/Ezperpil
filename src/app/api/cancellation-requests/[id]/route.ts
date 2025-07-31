import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { CancellationRequest } from '@/models/AdditionalService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    if (status !== 'processed') {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be processed' },
        { status: 400 }
      );
    }

    const cancellationRequest = await CancellationRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!cancellationRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: cancellationRequest });
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
