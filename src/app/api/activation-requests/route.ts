import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { ActivationRequest } from '@/models/AdditionalService';

export async function GET() {
  try {
    await dbConnect();
    const requests = await ActivationRequest.find({}).sort({ requestedAt: -1 });
    
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching activation requests:', error);
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
    const existingRequest = await ActivationRequest.findOne({ userId, serviceId });
    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Request already exists for this service' },
        { status: 400 }
      );
    }

    const activationRequest = new ActivationRequest({
      userId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      status: 'pending'
    });

    await activationRequest.save();

    return NextResponse.json({ success: true, request: activationRequest });
  } catch (error) {
    console.error('Error creating activation request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await dbConnect();
    await ActivationRequest.deleteMany({});
    
    return NextResponse.json({ success: true, message: 'All activation requests deleted' });
  } catch (error) {
    console.error('Error deleting activation requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete requests' },
      { status: 500 }
    );
  }
}
