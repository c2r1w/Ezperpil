import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { AdditionalService, IAdditionalService } from '@/models/AdditionalService';

export async function GET() {
  try {
    await dbConnect();
    const services = await AdditionalService.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching additional services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const { name, paymentLink, addServiceButtonText, activateServiceButtonText, cancelServiceButtonText, videoES, videoEN, active } = body;
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }

    const service = new AdditionalService({
      name,
      paymentLink: paymentLink || '',
      addServiceButtonText: addServiceButtonText || 'Agregar Servicio',
      activateServiceButtonText: activateServiceButtonText || 'Activar Servicio',
      cancelServiceButtonText: cancelServiceButtonText || 'Cancelar Servicio',
      videoES: videoES || { title: '', sourceType: 'url', url: '' },
      videoEN: videoEN || { title: '', sourceType: 'url', url: '' },
      active: active !== undefined ? active : true
    });

    await service.save();

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Error creating additional service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
