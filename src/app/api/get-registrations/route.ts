export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'visitor' or 'member'
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  try {
    if (type === 'visitor') {
      await Visitor.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    } else if (type === 'member') {
      await Member.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { Visitor, Member } from '@/models/Visitor';

export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'visitor' or 'member'
  const inviter = searchParams.get('inviter');
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    if (type === 'visitor') {
      const query = isAdmin ? {} : { inviter };
      const visitors = await Visitor.find(query).sort({ registeredAt: -1 });
      return NextResponse.json({ success: true, data: visitors });
    } else if (type === 'member') {
      const query = isAdmin ? {} : { inviter };
      const members = await Member.find(query).sort({ registeredAt: -1 });
      return NextResponse.json({ success: true, data: members });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
