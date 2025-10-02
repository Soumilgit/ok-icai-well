import mongoose from 'mongoose';

// User preferences schema for RAG caching
const UserPreferencesSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  writingVoicePreferences: {
    type: Object,
    default: null
  },
  questionnaireResponses: {
    type: Object,
    default: {}
  },
  progressStep: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Function to get or create the model safely
export function getUserPreferencesModel() {
  return mongoose.models?.UserPreferences || mongoose.model('UserPreferences', UserPreferencesSchema);
}

export interface CachedUserPreferences {
  userEmail: string;
  writingVoicePreferences: any;
  questionnaireResponses: { [questionId: string]: any };
  progressStep: number;
  lastUpdated: Date;
  isCompleted: boolean;
}

export class UserPreferencesCache {
  
  // Save or update user preferences and questionnaire progress
  static async saveUserProgress(userEmail: string, data: {
    questionnaireResponses?: { [questionId: string]: any };
    progressStep?: number;
    writingVoicePreferences?: any;
    isCompleted?: boolean;
  }): Promise<boolean> {
    try {
      // Use API route instead of direct database call
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          preferences: {
            writingVoicePreferences: data.writingVoicePreferences
          },
          progress: {
            questionnaireResponses: data.questionnaireResponses,
            progressStep: data.progressStep,
            isCompleted: data.isCompleted
          }
        })
      });
      
      if (response.ok) {
        console.log(`✅ Saved progress for user: ${userEmail}`);
        return true;
      }
      
      throw new Error('API call failed');
    } catch (error) {
      console.error('Error saving user progress:', error);
      // Fallback to localStorage
      try {
        const storageKey = `user_progress_${userEmail}`;
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const updatedData = { ...existingData, ...data, lastUpdated: new Date().toISOString() };
        localStorage.setItem(storageKey, JSON.stringify(updatedData));
        console.log('✅ Fallback: Saved to localStorage');
        return true;
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        return false;
      }
    }
  }
  
  // Retrieve user preferences and progress
  static async getUserProgress(userEmail: string): Promise<CachedUserPreferences | null> {
    try {
      // Use API route instead of direct database call
      const response = await fetch(`/api/user-preferences?email=${encodeURIComponent(userEmail)}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          console.log(`✅ Retrieved cached progress for user: ${userEmail}`);
          return {
            userEmail: result.data.userEmail,
            writingVoicePreferences: result.data.preferences?.writingVoicePreferences || {},
            questionnaireResponses: result.data.progress?.questionnaireResponses || {},
            progressStep: result.data.progress?.progressStep || 0,
            lastUpdated: result.data.lastUpdated,
            isCompleted: result.data.progress?.isCompleted || false
          };
        }
      }
      
      // Fallback to localStorage if API fails
      try {
        const storageKey = `user_progress_${userEmail}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          console.log('✅ Fallback: Retrieved from localStorage');
          return JSON.parse(stored);
        }
      } catch (localError) {
        console.error('Error retrieving from localStorage:', localError);
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving user progress:', error);
      // Fallback to localStorage
      try {
        const storageKey = `user_progress_${userEmail}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          console.log('✅ Fallback: Retrieved from localStorage');
          return JSON.parse(stored);
        }
      } catch (localError) {
        console.error('Error retrieving from localStorage:', localError);
      }
      return null;
    }
  }
  
  // Check if user has completed questionnaire
  static async isQuestionnaireCompleted(userEmail: string): Promise<boolean> {
    const progress = await this.getUserProgress(userEmail);
    return progress?.isCompleted || false;
  }
  
  // Clear user progress (for reset functionality)
  static async clearUserProgress(userEmail: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const UserPreferencesModel = getUserPreferencesModel();
      await UserPreferencesModel.deleteOne({ userEmail });
      
      // Also clear localStorage
      const storageKey = `user_progress_${userEmail}`;
      localStorage.removeItem(storageKey);
      
      console.log(`✅ Cleared progress for user: ${userEmail}`);
      return true;
    } catch (error) {
      console.error('Error clearing user progress:', error);
      return false;
    }
  }
  
  // Get all writing voice preferences for analytics
  static async getAllWritingVoicePreferences(): Promise<any[]> {
    try {
      await connectToDatabase();
      const UserPreferencesModel = getUserPreferencesModel();
      const preferences = await UserPreferencesModel.find(
        { isCompleted: true },
        { writingVoicePreferences: 1, userEmail: 1, lastUpdated: 1 }
      ).lean();
      
      return preferences.filter((p: any) => p.writingVoicePreferences);
    } catch (error) {
      console.error('Error retrieving all preferences:', error);
      return [];
    }
  }
}