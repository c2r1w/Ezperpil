import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { UserSubscribedService } from '@/models/AdditionalService';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userServices = await UserSubscribedService.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, userServices });
  } catch (error) {
    console.error('Error fetching user services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { userId, serviceId, status } = body;
    
    if (!userId || !serviceId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Service ID are required' },
        { status: 400 }
      );
    }

    // Check if user service already exists
    const existingUserService = await UserSubscribedService.findOne({ userId, serviceId });
    
    if (existingUserService) {
      // Update existing service
      existingUserService.status = status || 'pending_activation';
      if (status === 'active') {
        existingUserService.activatedAt = new Date();
      }
      await existingUserService.save();
      return NextResponse.json({ success: true, userService: existingUserService });
    } else {
      // Create new user service
      const userService = new UserSubscribedService({
        userId,
        serviceId,
        status: status || 'pending_activation',
        activatedAt: status === 'active' ? new Date() : undefined
      });

      await userService.save();
      return NextResponse.json({ success: true, userService });
    }
  } catch (error) {
    console.error('Error creating/updating user service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update user service' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userId, serviceId, status } = body;
    
    if (!userId || !serviceId || !status) {
      return NextResponse.json(
        { success: false, error: 'User ID, Service ID, and status are required' },
        { status: 400 }
      );
    }

    const userService = await UserSubscribedService.findOneAndUpdate(
      { userId, serviceId },
      { 
        status,
        ...(status === 'active' ? { activatedAt: new Date() } : {})
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, userService });
  } catch (error) {
    console.error('Error updating user service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user service' },
      { status: 500 }
    );
  }
}
