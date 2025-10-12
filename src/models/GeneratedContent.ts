import mongoose, { Document, Schema } from 'mongoose';

export interface IGeneratedContent extends Document {
  type: 'tax_article' | 'audit_checklist' | 'exam_questions' | 'seo_content' | 'compliance_guide' | 'loophole_analysis';
  title: string;
  content: string;
  sourceNewsIds: mongoose.Types.ObjectId[];
  prompt: string;
  model: 'qwen/qwen3-32b' | 'qwen/qwen2.5-72b-instruct' | 'llama3-8b-8192' | 'llama3-70b-8192' | 'mixtral-8x7b-32768';
  tokens: number;
  cost: number;
  metadata: {
    wordCount: number;
    readingTime: number;
    category: string;
    tags: string[];
    seoScore?: number;
  };
  status: 'draft' | 'reviewed' | 'published' | 'archived';
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedContentSchema = new Schema<IGeneratedContent>({
  type: {
    type: String,
    enum: ['tax_article', 'audit_checklist', 'exam_questions', 'seo_content', 'compliance_guide', 'loophole_analysis'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  sourceNewsIds: [{
    type: Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  }],
  prompt: {
    type: String,
    required: true
  },
  model: {
    type: String,
    enum: ['qwen/qwen3-32b', 'qwen/qwen2.5-72b-instruct', 'llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
    required: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: 'general'
    },
    tags: {
      type: [String],
      default: []
    },
    seoScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['draft', 'reviewed', 'published', 'archived'],
    default: 'draft'
  },
  reviewedBy: {
    type: String,
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
GeneratedContentSchema.index({ type: 1, status: 1 });
GeneratedContentSchema.index({ createdAt: -1 });
GeneratedContentSchema.index({ sourceNewsIds: 1 });

export default mongoose.models.GeneratedContent || mongoose.model<IGeneratedContent>('GeneratedContent', GeneratedContentSchema);
