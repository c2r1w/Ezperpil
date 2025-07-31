import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { Visitor, Member } from '@/models/Visitor';

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { type, ...data } = body;
  try {
    if (type === 'visitor') {
      const visitor = await Visitor.create(data);
      return NextResponse.json({ success: true, visitor });
    } else if (type === 'member') {
      const member = await Member.create(data);
      return NextResponse.json({ success: true, member });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
