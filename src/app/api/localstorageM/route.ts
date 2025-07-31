import { NextRequest, NextResponse } from 'next/server';
import LocalStorageM from '@/models/LocalStorageM';

import { dbConnect } from '@/lib/dbconnect';

// Connect to MongoDB (adjust your connection logic as needed)



await dbConnect();

export async function GET(req: NextRequest) {

    
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  const item = await LocalStorageM.findOne({ key });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ key: item.key, value: item.value });
}

export async function POST(req: NextRequest) {

    
  const { key, value } = await req.json();
  if (!key || value === undefined) return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
  const updated = await LocalStorageM.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
  return NextResponse.json({ key: updated.key, value: updated.value });
}

export async function DELETE(req: NextRequest) {

    
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  await LocalStorageM.deleteOne({ key });
  return NextResponse.json({ success: true });
}
