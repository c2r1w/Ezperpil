import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import WebinarTemplateState from '@/models/WebinarTemplateState';

// PUT - Update a specific template state
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { userId, active, title, description, presenter, date, sponsor, linkGenerated } = body;
    const templateId = params.id;
    
    if (!userId || !templateId) {
      return NextResponse.json({ success: false, error: 'User ID and template ID are required' }, { status: 400 });
    }

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (presenter !== undefined) updateData.presenter = presenter;
    if (date !== undefined) updateData.date = date;
    if (sponsor !== undefined) updateData.sponsor = sponsor;
    if (linkGenerated !== undefined) updateData.linkGenerated = linkGenerated;

    const updatedTemplate = await WebinarTemplateState.findOneAndUpdate(
      { userId, templateId },
      updateData,
      { new: true }
    );

    if (!updatedTemplate) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      template: {
        id: updatedTemplate.templateId,
        type: updatedTemplate.type,
        title: updatedTemplate.title,
        description: updatedTemplate.description,
        presenter: updatedTemplate.presenter,
        date: updatedTemplate.date,
        active: updatedTemplate.active,
        sponsor: updatedTemplate.sponsor,
        linkGenerated: updatedTemplate.linkGenerated,
      }
    });
  } catch (error) {
    console.error('Error updating template state:', error);
    return NextResponse.json({ success: false, error: 'Failed to update template state' }, { status: 500 });
  }
}

// DELETE - Delete a specific template state
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const templateId = params.id;
    
    if (!userId || !templateId) {
      return NextResponse.json({ success: false, error: 'User ID and template ID are required' }, { status: 400 });
    }

    const deletedTemplate = await WebinarTemplateState.findOneAndDelete({ userId, templateId });

    if (!deletedTemplate) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template state:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template state' }, { status: 500 });
  }
}
