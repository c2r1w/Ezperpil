import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { CancellationRequest } from '@/models/AdditionalService';

export async function GET() {
  try {
    await dbConnect();
    const requests = await CancellationRequest.find({}).sort({ requestedAt: -1 });
    
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { userId, userName, userEmail, serviceId, serviceName } = body;
    
    if (!userId || !serviceId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Service ID are required' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const existingRequest = await CancellationRequest.findOne({ userId, serviceId, status: 'pending' });
    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Cancellation request already exists for this service' },
        { status: 400 }
      );
    }

    const cancellationRequest = new CancellationRequest({
      userId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      status: 'pending'
    });

    await cancellationRequest.save();

    return NextResponse.json({ success: true, request: cancellationRequest });
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await CancellationRequest.deleteMany({});
    
    return NextResponse.json({ success: true, message: 'All cancellation requests deleted' });
  } catch (error) {
    console.error('Error deleting cancellation requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete requests' },
      { status: 500 }
    );
  }
}
