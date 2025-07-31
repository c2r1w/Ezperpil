import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { ActivationRequest } from '@/models/AdditionalService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be approved or rejected' },
        { status: 400 }
      );
    }

    const activationRequest = await ActivationRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!activationRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: activationRequest });
  } catch (error) {
    console.error('Error updating activation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
