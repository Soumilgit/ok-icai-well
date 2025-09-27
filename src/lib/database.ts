import mongoose from 'mongoose';
import { neon } from '@neondatabase/serverless';

// MongoDB connection for existing functionality
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ca-law-portal';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// NeonDB connection for user data
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

export const sql = neon(DATABASE_URL);

// Initialize user tables
export async function initializeUserTables() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        subscription_tier VARCHAR(50) DEFAULT 'free',
        preferences JSONB DEFAULT '{}'::jsonb
      )
    `;

    // Create user_activity table
    await sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        activity_type VARCHAR(100) NOT NULL,
        activity_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create user_content_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_content_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content_type VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        frequency VARCHAR(50) DEFAULT 'daily',
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('User tables initialized successfully');
  } catch (error) {
    console.error('Error initializing user tables:', error);
    throw error;
  }
}

// User management functions
export async function createOrUpdateUser(userData: {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}) {
  try {
    const result = await sql`
      INSERT INTO users (clerk_id, email, first_name, last_name, profile_image_url, updated_at)
      VALUES (${userData.clerkId}, ${userData.email}, ${userData.firstName || ''}, ${userData.lastName || ''}, ${userData.profileImageUrl || ''}, CURRENT_TIMESTAMP)
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = CURRENT_TIMESTAMP,
        last_login = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

export async function getUserByClerkId(clerkId: string) {
  try {
    const result = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;
    return result[0];
  } catch (error) {
    console.error('Error getting user by Clerk ID:', error);
    throw error;
  }
}

export async function updateUserActivity(userId: number, activityType: string, activityData: any = {}) {
  try {
    await sql`
      INSERT INTO user_activity (user_id, activity_type, activity_data)
      VALUES (${userId}, ${activityType}, ${JSON.stringify(activityData)})
    `;
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
}

export async function createUserNotification(userId: number, title: string, message: string, type: string = 'info') {
  try {
    await sql`
      INSERT INTO user_notifications (user_id, title, message, type)
      VALUES (${userId}, ${title}, ${message}, ${type})
    `;
  } catch (error) {
    console.error('Error creating user notification:', error);
    throw error;
  }
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  try {
    if (unreadOnly) {
      return await sql`
        SELECT * FROM user_notifications 
        WHERE user_id = ${userId} AND read = FALSE 
        ORDER BY created_at DESC
      `;
    } else {
      return await sql`
        SELECT * FROM user_notifications 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 50
      `;
    }
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}
