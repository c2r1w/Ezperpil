import { dbConnect } from "@/lib/dbconnect"; // Adjust the import path as necessary

export async function GET(request: Request) {
  try {
    await dbConnect();
    return new Response(JSON.stringify({ message: "MongoDB connection successful" }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: "MongoDB connection failed", error: error.message }), { status: 500 });
  }
}
