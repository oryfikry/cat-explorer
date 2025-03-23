import { NextRequest, NextResponse } from "next/server";
import { Cat } from "@/models/Cat";
import mongoose from "mongoose";
import { connectWithFastFail } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Verify the user is an admin
async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return false;
  }
  
  return session.user.email === "oryza4444@gmail.com";
}

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

// DELETE /api/cats/[id] - Delete a specific cat by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid cat ID" },
        { status: 400 }
      );
    }
    
    try {
      const client = await connectWithFastFail();
      const db = client.db();
      const catsCollection = db.collection("cats");
      
      // Delete the cat by ID
      const result = await catsCollection.deleteOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: "Cat not found or already deleted" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: "Cat deleted successfully" 
      });
    } catch (nativeError) {
      console.warn("Native MongoDB driver operation failed, falling back to Mongoose:", nativeError);
      
      // Fall back to Mongoose if native driver fails
      if (mongoose.connection.readyState < 1) {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
      }
      
      const result = await Cat.findByIdAndDelete(id);
      
      if (!result) {
        return NextResponse.json(
          { error: "Cat not found or already deleted" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: "Cat deleted successfully" 
      });
    }
  } catch (error) {
    console.error("Error deleting cat:", error);
    return NextResponse.json(
      { error: "Failed to delete cat" },
      { status: 500 }
    );
  }
}

// PUT /api/cats/[id] - Update a specific cat by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid cat ID" },
        { status: 400 }
      );
    }
    
    // Get the current session to access user email
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "User session not found" },
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
    
    // Prepare the updated cat document
    const updateData = {
      name: data.name,
      image: data.image,
      description: data.description || "",
      location: {
        coordinates: data.location.coordinates,
        address: data.location.address || "",
      },
      tags: data.tags ? 
        (typeof data.tags === 'string' ? 
          data.tags.split(",").map((tag: string) => tag.trim()) : 
          data.tags
        ) : [],
      updatedAt: new Date(),
      updatedByEmail: session.user.email, // Save the current user's email
    };
    
    try {
      const client = await connectWithFastFail();
      const db = client.db();
      const catsCollection = db.collection("cats");
      
      // Update the cat by ID
      const result = await catsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Cat not found" },
          { status: 404 }
        );
      }
      
      // Get the updated cat
      const updatedCat = await catsCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(id) 
      });
      
      // Convert MongoDB _id to string for better JSON serialization
      const catWithStringId = updatedCat ? {
        ...updatedCat,
        _id: updatedCat._id.toString()
      } : null;
      
      return NextResponse.json({ 
        success: true,
        message: "Cat updated successfully",
        cat: catWithStringId
      });
    } catch (nativeError) {
      console.warn("Native MongoDB driver operation failed, falling back to Mongoose:", nativeError);
      
      // Fall back to Mongoose if native driver fails
      if (mongoose.connection.readyState < 1) {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        await mongoose.connect(process.env.MONGODB_URI);
      }
      
      const updatedCat = await Cat.findByIdAndUpdate(id, updateData, { new: true }).lean();
      
      if (!updatedCat) {
        return NextResponse.json(
          { error: "Cat not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: "Cat updated successfully",
        cat: updatedCat
      });
    }
  } catch (error) {
    console.error("Error updating cat:", error);
    return NextResponse.json(
      { error: "Failed to update cat" },
      { status: 500 }
    );
  }
} 