import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import WebinarTemplateState from '@/models/WebinarTemplateState';

// GET - Fetch all template states for a user
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const templateStates = await WebinarTemplateState.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      templates: templateStates.map(state => ({
        id: state.templateId,
        type: state.type,
        title: state.title,
        description: state.description,
        presenter: state.presenter,
        date: state.date,
        active: state.active,
        sponsor: state.sponsor,
        linkGenerated: state.linkGenerated,
      }))
    });
  } catch (error) {
    console.error('Error fetching template states:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch template states' }, { status: 500 });
  }
}

// POST - Create new template state
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { userId, templateId, type, title, description, presenter, date, active, sponsor, linkGenerated } = body;
    
    if (!userId || !templateId || !type || !title || !description || !presenter || !date) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const templateState = new WebinarTemplateState({
      userId,
      templateId,
      type,
      title,
      description,
      presenter,
      date,
      active: active || false,
      sponsor: sponsor || null,
      linkGenerated: linkGenerated || false,
    });

    await templateState.save();
    
    return NextResponse.json({ 
      success: true, 
      template: {
        id: templateState.templateId,
        type: templateState.type,
        title: templateState.title,
        description: templateState.description,
        presenter: templateState.presenter,
        date: templateState.date,
        active: templateState.active,
        sponsor: templateState.sponsor,
        linkGenerated: templateState.linkGenerated,
      }
    });
  } catch (error: any) {
    console.error('Error creating template state:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Template already exists for this user' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to create template state' }, { status: 500 });
  }
}

// PUT - Update all template states for a user (bulk update)
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { userId, templates } = body;
    
    if (!userId || !Array.isArray(templates)) {
      return NextResponse.json({ success: false, error: 'User ID and templates array are required' }, { status: 400 });
    }

    // Delete existing templates for this user
    await WebinarTemplateState.deleteMany({ userId });

    // Insert new templates
    const templateStates = templates.map(template => ({
      userId,
      templateId: template.id,
      type: template.type,
      title: template.title,
      description: template.description,
      presenter: template.presenter,
      date: template.date,
      active: template.active || false,
      sponsor: template.sponsor || null,
      linkGenerated: template.linkGenerated || false,
    }));

    await WebinarTemplateState.insertMany(templateStates);
    
    return NextResponse.json({ success: true, message: 'Template states updated successfully' });
  } catch (error) {
    console.error('Error updating template states:', error);
    return NextResponse.json({ success: false, error: 'Failed to update template states' }, { status: 500 });
  }
}
