import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 30000, // 30 seconds
  maxIdleTimeMS: 120000,   // 2 minutes
  retryWrites: true,
  // Use type assertion for w property
  w: 'majority' as any,
};

let client;
let clientPromise: Promise<MongoClient>;

// Reconnection function with exponential backoff
const connectWithRetry = async (client: MongoClient, retries = 5, backoff = 1000) => {
  try {
    console.log('Attempting MongoDB connection...');
    await client.connect();
    console.log('MongoDB connection established successfully');
    return client;
  } catch (err: any) {
    if (retries <= 0) {
      console.error('MongoDB connection failed after multiple retries:', err);
      throw err;
    }
    
    const delay = backoff * (Math.pow(2, 5 - retries) - 1);
    console.log(`MongoDB connection error, retrying in ${delay}ms:`, err.message);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(client, retries - 1, backoff);
  }
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = connectWithRetry(client)
      .catch(err => {
        console.error('Failed to connect to MongoDB in development:', err);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = connectWithRetry(client)
    .catch(err => {
      console.error('Failed to connect to MongoDB in production:', err);
      throw err;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 