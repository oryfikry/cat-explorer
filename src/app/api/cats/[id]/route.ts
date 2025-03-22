import { NextRequest, NextResponse } from "next/server";
import { Cat } from "@/models/Cat";
import mongoose from "mongoose";

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  
  return mongoose.connect(process.env.MONGODB_URI);
};

// GET /api/cats/[id] - Get a specific cat by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid cat ID" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const cat = await Cat.findById(id).lean();
    
    if (!cat) {
      return NextResponse.json(
        { error: "Cat not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(cat);
  } catch (error) {
    console.error("Error fetching cat:", error);
    return NextResponse.json(
      { error: "Failed to fetch cat" },
      { status: 500 }
    );
  }
} 