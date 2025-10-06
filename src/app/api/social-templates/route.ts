import { NextRequest, NextResponse } from 'next/server';

interface SocialTemplate {
  id: string;
  title: string;
  category: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'general';
  type: 'post' | 'article' | 'story' | 'carousel';
  template: string;
  variables: string[];
  tags: string[];
  icaiCompliant: boolean;
  tone: 'professional' | 'casual' | 'educational' | 'promotional' | 'thought-leadership';
  industry: 'ca' | 'finance' | 'audit' | 'tax' | 'compliance' | 'general';
  engagement_score: number;
  usage_count: number;
}

// Comprehensive templates for CA professionals
const SOCIAL_TEMPLATES: SocialTemplate[] = [
  // LinkedIn Professional Posts
  {
    id: 'linkedin_tax_update',
    title: 'Tax Law Update - Professional',
    category: 'linkedin',
    type: 'post',
    template: `🏛️ BREAKING: {{tax_update_title}}

Key Changes:
{{#each changes}}
• {{this}}
{{/each}}

Impact on Business:
{{impact_description}}

As CAs, we must adapt quickly to these changes. Here's what I recommend:

1. {{recommendation_1}}
2. {{recommendation_2}}
3. {{recommendation_3}}

💡 Pro Tip: {{pro_tip}}

Thoughts on this update? Share your perspective below! 👇

#CA #TaxLaw #ICAI #Compliance #{{industry_hashtag}}`,
    variables: ['tax_update_title', 'changes', 'impact_description', 'recommendation_1', 'recommendation_2', 'recommendation_3', 'pro_tip', 'industry_hashtag'],
    tags: ['tax', 'compliance', 'update', 'professional'],
    icaiCompliant: true,
    tone: 'professional',
    industry: 'tax',
    engagement_score: 8.5,
    usage_count: 156
  },
  
  {
    id: 'linkedin_audit_insights',
    title: 'Audit Insights - Thought Leadership',
    category: 'linkedin',
    type: 'post',
    template: `🔍 Audit Insight: {{insight_title}}

After {{years_experience}} years in auditing, I've observed:

{{main_observation}}

Why this matters:
{{#each reasons}}
→ {{this}}
{{/each}}

Key Takeaways:
✅ {{takeaway_1}}
✅ {{takeaway_2}} 
✅ {{takeaway_3}}

What's your experience with {{topic}}? Let's discuss! 💬

#Audit #ICAI #ProfessionalDevelopment #{{specific_hashtag}}`,
    variables: ['insight_title', 'years_experience', 'main_observation', 'reasons', 'takeaway_1', 'takeaway_2', 'takeaway_3', 'topic', 'specific_hashtag'],
    tags: ['audit', 'insights', 'experience', 'discussion'],
    icaiCompliant: true,
    tone: 'thought-leadership',
    industry: 'audit',
    engagement_score: 9.2,
    usage_count: 203
  },

  {
    id: 'linkedin_gst_compliance',
    title: 'GST Compliance Checklist',
    category: 'linkedin',
    type: 'post',
    template: `📋 GST Compliance Checklist for {{month_year}}

Essential tasks for CA firms:

🔸 Monthly Returns:
   • GSTR-1: {{gstr1_date}}
   • GSTR-3B: {{gstr3b_date}}

🔸 Input Tax Credit:
   • Reconcile GSTR-2A
   • Verify supplier invoices
   • {{additional_itc_task}}

🔸 Common Mistakes to Avoid:
   ❌ {{mistake_1}}
   ❌ {{mistake_2}}
   ❌ {{mistake_3}}

💡 Pro Tip: {{compliance_tip}}

Save this post for quick reference! 🔖

Need GST assistance? DM me for consultation.

#GST #Compliance #CA #TaxConsultant #ICAI`,
    variables: ['month_year', 'gstr1_date', 'gstr3b_date', 'additional_itc_task', 'mistake_1', 'mistake_2', 'mistake_3', 'compliance_tip'],
    tags: ['gst', 'compliance', 'checklist', 'deadline'],
    icaiCompliant: true,
    tone: 'educational',
    industry: 'tax',
    engagement_score: 7.8,
    usage_count: 298
  },

  // Twitter Templates
  {
    id: 'twitter_quick_tip',
    title: 'Quick CA Tip - Twitter',
    category: 'twitter',
    type: 'post',
    template: `💡 CA Quick Tip #{{tip_number}}

{{tip_title}}

{{tip_description}}

{{actionable_advice}}

#CA #{{category_hashtag}} #ProfessionalTip

🧵 Thread (1/{{thread_count}})`,
    variables: ['tip_number', 'tip_title', 'tip_description', 'actionable_advice', 'category_hashtag', 'thread_count'],
    tags: ['tip', 'quick', 'educational', 'thread'],
    icaiCompliant: true,
    tone: 'educational',
    industry: 'general',
    engagement_score: 6.5,
    usage_count: 445
  },

  // Content Marketing Templates
  {
    id: 'linkedin_case_study',
    title: 'Client Success Case Study',
    category: 'linkedin',
    type: 'article',
    template: `🎯 Case Study: How We Saved {{client_type}} {{savings_amount}} in Tax Compliance

The Challenge:
{{challenge_description}}

Our Approach:
{{#each approach_steps}}
{{@index}}. {{this}}
{{/each}}

The Result:
💰 {{financial_result}}
⏱️ {{time_result}}
📈 {{efficiency_result}}

Key Learnings:
{{#each learnings}}
• {{this}}
{{/each}}

This demonstrates the value of {{service_type}} in today's business environment.

Facing similar challenges? Let's connect! 🤝

#CaseStudy #CA #{{service_hashtag}} #ClientSuccess #ICAI`,
    variables: ['client_type', 'savings_amount', 'challenge_description', 'approach_steps', 'financial_result', 'time_result', 'efficiency_result', 'learnings', 'service_type', 'service_hashtag'],
    tags: ['case-study', 'success', 'results', 'client'],
    icaiCompliant: true,
    tone: 'professional',
    industry: 'general',
    engagement_score: 9.0,
    usage_count: 87
  },

  // Educational Content
  {
    id: 'linkedin_icai_update',
    title: 'ICAI Guidelines Update',
    category: 'linkedin',
    type: 'post',
    template: `🏛️ ICAI Update Alert: {{update_title}}

📅 Effective Date: {{effective_date}}

What's New:
{{#each new_features}}
✨ {{this}}
{{/each}}

Impact on Practice:
{{practice_impact}}

Action Required:
{{#each action_items}}
☑️ {{this}}
{{/each}}

Compliance Timeline:
📌 {{timeline_item_1}}: {{date_1}}
📌 {{timeline_item_2}}: {{date_2}}
📌 {{timeline_item_3}}: {{date_3}}

Resources:
🔗 {{resource_link}}
📖 {{reference_document}}

Stay compliant, stay ahead! 💪

#ICAI #ComplianceUpdate #CA #ProfessionalStandards`,
    variables: ['update_title', 'effective_date', 'new_features', 'practice_impact', 'action_items', 'timeline_item_1', 'date_1', 'timeline_item_2', 'date_2', 'timeline_item_3', 'date_3', 'resource_link', 'reference_document'],
    tags: ['icai', 'update', 'compliance', 'guidelines'],
    icaiCompliant: true,
    tone: 'professional',
    industry: 'compliance',
    engagement_score: 8.7,
    usage_count: 134
  }
];

// Add more templates to reach 50+ (abbreviated for space)
const generateMoreTemplates = (): SocialTemplate[] => {
  const baseTemplates = [
    { category: 'linkedin', type: 'post', tone: 'educational', industry: 'finance' },
    { category: 'twitter', type: 'post', tone: 'casual', industry: 'ca' },
    { category: 'linkedin', type: 'article', tone: 'thought-leadership', industry: 'audit' },
    // ... more template configs
  ];

  return baseTemplates.map((config, index) => ({
    id: `template_${index + 10}`,
    title: `${config.category} ${config.industry} template ${index + 1}`,
    category: config.category as SocialTemplate['category'],
    type: config.type as SocialTemplate['type'],
    template: `Template content for ${config.industry} professionals...`,
    variables: ['var1', 'var2', 'var3'],
    tags: [config.industry, config.tone],
    icaiCompliant: true,
    tone: config.tone as SocialTemplate['tone'],
    industry: config.industry as SocialTemplate['industry'],
    engagement_score: Math.random() * 10,
    usage_count: Math.floor(Math.random() * 500)
  }));
};

const ALL_TEMPLATES = [...SOCIAL_TEMPLATES, ...generateMoreTemplates()];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const tone = searchParams.get('tone');
    const type = searchParams.get('type');
    const icaiCompliant = searchParams.get('icaiCompliant');
    const sortBy = searchParams.get('sortBy') || 'engagement_score';
    const limit = parseInt(searchParams.get('limit') || '50');

    let filteredTemplates = ALL_TEMPLATES;

    // Apply filters
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }
    if (industry) {
      filteredTemplates = filteredTemplates.filter(t => t.industry === industry);
    }
    if (tone) {
      filteredTemplates = filteredTemplates.filter(t => t.tone === tone);
    }
    if (type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }
    if (icaiCompliant === 'true') {
      filteredTemplates = filteredTemplates.filter(t => t.icaiCompliant);
    }

    // Sort templates
    filteredTemplates.sort((a, b) => {
      if (sortBy === 'engagement_score') return b.engagement_score - a.engagement_score;
      if (sortBy === 'usage_count') return b.usage_count - a.usage_count;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    // Apply limit
    const finalTemplates = filteredTemplates.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        templates: finalTemplates,
        total: filteredTemplates.length,
        filters: {
          categories: [...new Set(ALL_TEMPLATES.map(t => t.category))],
          industries: [...new Set(ALL_TEMPLATES.map(t => t.industry))],
          tones: [...new Set(ALL_TEMPLATES.map(t => t.tone))],
          types: [...new Set(ALL_TEMPLATES.map(t => t.type))]
        }
      }
    });

  } catch (error) {
    console.error('Social templates API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, variables, preview = false } = body;

    if (!templateId || !variables) {
      return NextResponse.json(
        { success: false, error: 'Template ID and variables are required' },
        { status: 400 }
      );
    }

    const template = ALL_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Simple template engine (replace with Handlebars in production)
    let processedContent = template.template;
    
    // Replace simple variables
    template.variables.forEach(variable => {
      const value = variables[variable] || `{{${variable}}}`;
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    // Handle array iterations (simplified)
    const arrayRegex = /\{\{#each (\w+)\}\}(.*?)\{\{\/each\}\}/gs;
    processedContent = processedContent.replace(arrayRegex, (match, arrayName, content) => {
      const arrayValue = variables[arrayName];
      if (Array.isArray(arrayValue)) {
        return arrayValue.map(item => content.replace(/\{\{this\}\}/g, item)).join('\n');
      }
      return match;
    });

    if (!preview) {
      // Update usage count
      template.usage_count += 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        content: processedContent,
        template: {
          id: template.id,
          title: template.title,
          category: template.category,
          icaiCompliant: template.icaiCompliant
        },
        preview
      }
    });

  } catch (error) {
    console.error('Template processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process template' },
      { status: 500 }
    );
  }
}