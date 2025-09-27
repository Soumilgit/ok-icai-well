import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  type: 'daily_update' | 'breaking_news' | 'compliance_alert' | 'exam_update';
  title: string;
  message: string;
  content: string;
  recipients: {
    email: string;
    name: string;
    role: 'ceo' | 'ca' | 'content_writer' | 'seo_specialist';
  }[];
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  priority: 'high' | 'medium' | 'low';
  metadata: {
    sourceNewsIds?: mongoose.Types.ObjectId[];
    generatedContentIds?: mongoose.Types.ObjectId[];
    attachments?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: ['daily_update', 'breaking_news', 'compliance_alert', 'exam_update'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  recipients: [{
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['ceo', 'ca', 'content_writer', 'seo_specialist'],
      required: true
    }
  }],
  sentAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  metadata: {
    sourceNewsIds: [{
      type: Schema.Types.ObjectId,
      ref: 'NewsArticle'
    }],
    generatedContentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'GeneratedContent'
    }],
    attachments: {
      type: [String],
      default: []
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NotificationSchema.index({ status: 1, priority: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
