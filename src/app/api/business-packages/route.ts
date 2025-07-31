import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import BusinessPackage from '@/models/BusinessPackage';

export async function GET() {
  await dbConnect();
  try {
    const packages = await BusinessPackage.find({});
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch packages.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const data = await req.json();
    const pkg = new BusinessPackage(data);
    await pkg.save();
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create package.' }, { status: 500 });
  }
}
