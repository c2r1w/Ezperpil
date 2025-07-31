import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import BusinessPackage from '@/models/BusinessPackage';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const data = await req.json();
    const updatedPackage = await BusinessPackage.findByIdAndUpdate(params.id, data, { new: true });
    if (!updatedPackage) {
      return NextResponse.json({ success: false, error: 'Package not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, package: updatedPackage });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update package.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const deletedPackage = await BusinessPackage.findByIdAndDelete(params.id);
    if (!deletedPackage) {
      return NextResponse.json({ success: false, error: 'Package not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete package.' }, { status: 500 });
  }
}
