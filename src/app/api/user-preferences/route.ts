import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database';
import { getUserPreferencesModel } from '@/lib/user-preferences-cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const UserPreferencesModel = getUserPreferencesModel();
    const userPrefs = await UserPreferencesModel.findOne({ userEmail }).lean();

    if (!userPrefs) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ 
      data: {
        userEmail: userPrefs.userEmail,
        preferences: userPrefs.preferences,
        progress: userPrefs.progress,
        lastUpdated: userPrefs.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, preferences, progress } = body;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const UserPreferencesModel = getUserPreferencesModel();

    const updatedPrefs = await UserPreferencesModel.findOneAndUpdate(
      { userEmail },
      {
        userEmail,
        preferences: preferences || {},
        progress: progress || {},
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ 
      success: true,
      data: {
        userEmail: updatedPrefs.userEmail,
        preferences: updatedPrefs.preferences,
        progress: updatedPrefs.progress,
        lastUpdated: updatedPrefs.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save user preferences' },
      { status: 500 }
    );
  }
}