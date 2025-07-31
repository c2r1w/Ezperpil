import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'aplos';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!uri) return NextResponse.json({ error: 'No MongoDB URI' }, { status: 500 });
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('webinar_members');
    const result = await collection.insertOne({ ...data, createdAt: new Date() });
    await client.close();
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) {
    let message = 'Unknown error';
    if (e instanceof Error) message = e.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
