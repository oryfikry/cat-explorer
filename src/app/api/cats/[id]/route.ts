import { NextRequest, NextResponse } from "next/server";
import { Cat } from "@/models/Cat";
import mongoose from "mongoose";
import { connectWithFastFail } from "@/lib/mongodb";

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
    
    // Try to use MongoDB native driver first for better performance
    try {
      const client = await connectWithFastFail();
      const db = client.db();
      const catsCollection = db.collection("cats");
      
      // Find the cat by ID
      const cat = await catsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (!cat) {
        return NextResponse.json(
          { error: "Cat not found" },
          { status: 404 }
        );
      }
      
      // Convert MongoDB _id to string for better JSON serialization
      const catWithStringId = {
        ...cat,
        _id: cat._id.toString()
      };
      
      return NextResponse.json(catWithStringId);
    } catch (nativeError) {
      console.warn("Native MongoDB driver query failed, falling back to Mongoose:", nativeError);
      
      // Fall back to Mongoose if native driver fails
      if (mongoose.connection.readyState < 1) {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
      }
      
      const cat = await Cat.findById(id).lean();
      
      if (!cat) {
        return NextResponse.json(
          { error: "Cat not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(cat);
    }
  } catch (error) {
    console.error("Error fetching cat:", error);
    return NextResponse.json(
      { error: "Failed to fetch cat" },
      { status: 500 }
    );
  }
} 