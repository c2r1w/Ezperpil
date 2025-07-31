// Test script to verify MongoDB implementation for Additional Services
import { fetchAdditionalServices, createAdditionalService } from '@/lib/additional-services';

async function testMongoImplementation() {
  try {
    console.log('Testing fetchAdditionalServices...');
    const services = await fetchAdditionalServices();
    console.log(`✅ Fetched ${services.length} services`);
    
    console.log('Testing createAdditionalService...');
    const testService = await createAdditionalService({
      name: 'Test Service',
      paymentLink: 'https://test.com',
      addServiceButtonText: 'Add Test',
      activateServiceButtonText: 'Activate Test',
      cancelServiceButtonText: 'Cancel Test',
      videoES: { title: 'Test ES', sourceType: 'url', url: '' },
      videoEN: { title: 'Test EN', sourceType: 'url', url: '' },
      active: true
    });
    console.log('✅ Created test service:', testService.id);
    
    console.log('✅ All tests passed! MongoDB implementation is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export default testMongoImplementation;
