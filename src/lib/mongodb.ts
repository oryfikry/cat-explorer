import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  // Decrease timeouts for serverless environment
  connectTimeoutMS: 5000, // 5 seconds
  socketTimeoutMS: 5000,  // 5 seconds
  serverSelectionTimeoutMS: 5000, // 5 seconds
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Add timeout wrapper for optimized connection in serverless environments
export const connectWithFastFail = async (timeoutMs = 4000): Promise<MongoClient> => {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`MongoDB connection timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    // Race the MongoDB connection against a timeout
    const client = await Promise.race([
      clientPromise,
      timeoutPromise
    ]) as MongoClient;
    
    // Ping database to confirm connection is alive
    const db = client.db();
    await db.command({ ping: 1 });
    console.log("MongoDB connection established successfully!");
    
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

// Export a module-scoped MongoClient promise
export default clientPromise; 