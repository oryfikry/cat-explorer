import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

// GET /api/cats - Fetch cats with optional location-based filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse location parameters
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const maxDistance = searchParams.get("distance") || "10"; // Default 10km
    
    await connectDB();
    
    // If location is provided, do a geospatial query
    if (lat && lng) {
      const cats = await Cat.find({
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseInt(maxDistance) * 1000 // Convert km to meters
          }
        }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      
      return NextResponse.json(cats);
    }
    
    // Otherwise return the most recent cats
    const cats = await Cat.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    
    return NextResponse.json(cats);
  } catch (error) {
    console.error("Error fetching cats:", error);
    return NextResponse.json(
      { error: "Failed to fetch cats" },
      { status: 500 }
    );
  }
}

// POST /api/cats - Create a new cat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.image || !body.location?.coordinates) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Create new cat
    const newCat = await Cat.create({
      name: body.name,
      image: body.image,
      description: body.description,
      location: {
        coordinates: body.location.coordinates,
        address: body.location.address
      },
      tags: body.tags?.split(",").map((tag: string) => tag.trim()) || [],
      userId: session.user?.id,
    });
    
    return NextResponse.json(
      { message: "Cat created successfully", cat: newCat },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cat:", error);
    return NextResponse.json(
      { error: "Failed to create cat" },
      { status: 500 }
    );
  }
} 