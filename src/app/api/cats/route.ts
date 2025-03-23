import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Cat } from "@/models/Cat";
import mongoose from "mongoose";
import clientPromise, { connectWithFastFail } from "@/lib/mongodb";

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
    
    // Try to use MongoDB native driver first for better performance
    try {
      const client = await connectWithFastFail();
      const db = client.db();
      const catsCollection = db.collection("cats");
      
      // If location is provided, do a geospatial query
      if (lat && lng) {
        // Implement geospatial query with native MongoDB driver
        const cats = await catsCollection.find({
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
        .toArray();
        
        return NextResponse.json(cats);
      }
      
      // Otherwise return the most recent cats using native driver
      const cats = await catsCollection.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();
      
      return NextResponse.json(cats);
      
    } catch (nativeError) {
      console.warn("Native MongoDB driver query failed, falling back to Mongoose:", nativeError);
      
      // Fall back to Mongoose if native driver fails
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
    }
  } catch (error) {
    console.error("Error fetching cats:", error);
    return NextResponse.json(
      { error: "Failed to fetch cats" },
      { status: 500 }
    );
  }
}

// GET handler to get all cats
export async function GETAll() {
  try {
    const client = await connectWithFastFail();
    const db = client.db();
    const catsCollection = db.collection("cats");
    
    // Get all cats, sort by createdAt in descending order (newest first)
    const cats = await catsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
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
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.image || !data.location?.coordinates) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get userId safely from the session
    let userId = null;
    if (session.user && typeof session.user === 'object') {
      // Try to get the ID from various possible properties
      userId = 
        // @ts-ignore - NextAuth types may not include these but they could exist
        session.user.id || 
        // @ts-ignore
        session.user.sub || 
        // @ts-ignore  
        session.user._id;
    }
    
    if (!userId) {
      console.error("Cannot identify user ID from session:", session);
      return NextResponse.json(
        { error: "User identification failed" },
        { status: 500 }
      );
    }
    
    // Connect to MongoDB
    const client = await connectWithFastFail();
    const db = client.db();
    const catsCollection = db.collection("cats");
    
    // Prepare the cat document
    const newCat = {
      name: data.name,
      image: data.image,
      description: data.description || "",
      location: {
        coordinates: data.location.coordinates,
        address: data.location.address || "",
      },
      tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the cat into the database
    const result = await catsCollection.insertOne(newCat);
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: "Cat added successfully" 
    });
  } catch (error) {
    console.error("Error adding cat:", error);
    return NextResponse.json(
      { error: "Failed to add cat" },
      { status: 500 }
    );
  }
} 