import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbconnect';
import { AdditionalService } from '@/models/AdditionalService';

const initialServices = [
  { 
    name: 'Sistema de Marketing', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'Sistema de Escaneo', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'Manejo de Gastos e Ingresos', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'Sistema de Incentivos', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Store', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Servicios Locales', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Business Card', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil E Courses', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Prestamos y Credit Repair', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Vittual Asistant', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  },
  { 
    name: 'EZ Perfil Social Media Management', 
    paymentLink: '', 
    addServiceButtonText: 'Agregar Servicio', 
    activateServiceButtonText: 'Activar Servicio', 
    cancelServiceButtonText: 'Cancelar Servicio', 
    videoES: { title: '', sourceType: 'url', url: '' }, 
    videoEN: { title: '', sourceType: 'url', url: '' }, 
    active: true 
  }
];

export async function POST() {
  try {
    await dbConnect();
    
    // Check if services already exist
    const existingServices = await AdditionalService.find({});
    if (existingServices.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Services already seeded',
        count: existingServices.length
      });
    }

    // Insert initial services
    const services = await AdditionalService.insertMany(initialServices);
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      services: services.length
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
