import mongoose, { Document, Schema } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  content: string;
  summary: string;
  source: 'ANI' | 'ECONOMIC_TIMES' | 'ICAI' | 'LIVEMINT';
  url: string;
  publishedAt: Date;
  processedAt?: Date;
  category: 'tax' | 'compliance' | 'audit' | 'general';
  impact: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NewsArticleSchema = new Schema<INewsArticle>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['ANI', 'ECONOMIC_TIMES', 'ICAI', 'LIVEMINT'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    required: true
  },
  processedAt: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['tax', 'compliance', 'audit', 'general'],
    default: 'general'
  },
  impact: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NewsArticleSchema.index({ source: 1, publishedAt: -1 });
NewsArticleSchema.index({ category: 1, impact: 1 });
NewsArticleSchema.index({ url: 1 }, { unique: true });
NewsArticleSchema.index({ processedAt: 1 });

export default mongoose.models.NewsArticle || mongoose.model<INewsArticle>('NewsArticle', NewsArticleSchema);
