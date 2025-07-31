// Utility functions for Additional Services API

export interface AdditionalServiceData {
  id?: string;
  name: string;
  paymentLink: string;
  addServiceButtonText: string;
  activateServiceButtonText: string;
  cancelServiceButtonText: string;
  videoES: {
    title: string;
    sourceType: 'url' | 'upload';
    url: string;
  };
  videoEN: {
    title: string;
    sourceType: 'url' | 'upload';
    url: string;
  };
  active: boolean;
  createdAt?: string;
}

export interface ActivationRequestData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CancellationRequestData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt?: string;
  status: 'pending' | 'processed';
}

export interface UserSubscribedServiceData {
  id?: string;
  userId: string;
  serviceId: string;
  status: 'pending_activation' | 'active' | 'pending_cancellation';
  activatedAt?: string;
  createdAt?: string;
}

// Additional Services
export async function fetchAdditionalServices(): Promise<AdditionalServiceData[]> {
  try {
    const response = await fetch('/api/additional-services');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch services');
    }
    
    return data.services.map((service: any) => ({
      id: service._id,
      name: service.name,
      paymentLink: service.paymentLink,
      addServiceButtonText: service.addServiceButtonText,
      activateServiceButtonText: service.activateServiceButtonText,
      cancelServiceButtonText: service.cancelServiceButtonText,
      videoES: service.videoES,
      videoEN: service.videoEN,
      active: service.active,
      createdAt: service.createdAt
    }));
  } catch (error) {
    console.error('Error fetching additional services:', error);
    throw error;
  }
}

export async function createAdditionalService(service: Omit<AdditionalServiceData, 'id' | 'createdAt'>): Promise<AdditionalServiceData> {
  try {
    const response = await fetch('/api/additional-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(service),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create service');
    }
    
    return {
      id: data.service._id,
      name: data.service.name,
      paymentLink: data.service.paymentLink,
      addServiceButtonText: data.service.addServiceButtonText,
      activateServiceButtonText: data.service.activateServiceButtonText,
      cancelServiceButtonText: data.service.cancelServiceButtonText,
      videoES: data.service.videoES,
      videoEN: data.service.videoEN,
      active: data.service.active,
      createdAt: data.service.createdAt
    };
  } catch (error) {
    console.error('Error creating additional service:', error);
    throw error;
  }
}

export async function updateAdditionalService(id: string, updates: Partial<AdditionalServiceData>): Promise<AdditionalServiceData> {
  try {
    const response = await fetch(`/api/additional-services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update service');
    }
    
    return {
      id: data.service._id,
      name: data.service.name,
      paymentLink: data.service.paymentLink,
      addServiceButtonText: data.service.addServiceButtonText,
      activateServiceButtonText: data.service.activateServiceButtonText,
      cancelServiceButtonText: data.service.cancelServiceButtonText,
      videoES: data.service.videoES,
      videoEN: data.service.videoEN,
      active: data.service.active,
      createdAt: data.service.createdAt
    };
  } catch (error) {
    console.error('Error updating additional service:', error);
    throw error;
  }
}

export async function deleteAdditionalService(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/additional-services/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete service');
    }
  } catch (error) {
    console.error('Error deleting additional service:', error);
    throw error;
  }
}

// Activation Requests
export async function fetchActivationRequests(): Promise<ActivationRequestData[]> {
  try {
    const response = await fetch('/api/activation-requests');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch requests');
    }
    
    return data.requests.map((request: any) => ({
      id: request._id,
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      requestedAt: request.requestedAt,
      status: request.status
    }));
  } catch (error) {
    console.error('Error fetching activation requests:', error);
    throw error;
  }
}

export async function createActivationRequest(request: Omit<ActivationRequestData, 'id' | 'requestedAt' | 'status'>): Promise<ActivationRequestData> {
  try {
    const response = await fetch('/api/activation-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create request');
    }
    
    return {
      id: data.request._id,
      userId: data.request.userId,
      userName: data.request.userName,
      userEmail: data.request.userEmail,
      serviceId: data.request.serviceId,
      serviceName: data.request.serviceName,
      requestedAt: data.request.requestedAt,
      status: data.request.status
    };
  } catch (error) {
    console.error('Error creating activation request:', error);
    throw error;
  }
}

export async function updateActivationRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<ActivationRequestData> {
  try {
    const response = await fetch(`/api/activation-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update request');
    }
    
    return {
      id: data.request._id,
      userId: data.request.userId,
      userName: data.request.userName,
      userEmail: data.request.userEmail,
      serviceId: data.request.serviceId,
      serviceName: data.request.serviceName,
      requestedAt: data.request.requestedAt,
      status: data.request.status
    };
  } catch (error) {
    console.error('Error updating activation request:', error);
    throw error;
  }
}

export async function deleteAllActivationRequests(): Promise<void> {
  try {
    const response = await fetch('/api/activation-requests', {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete requests');
    }
  } catch (error) {
    console.error('Error deleting activation requests:', error);
    throw error;
  }
}

// Cancellation Requests
export async function fetchCancellationRequests(): Promise<CancellationRequestData[]> {
  try {
    const response = await fetch('/api/cancellation-requests');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch requests');
    }
    
    return data.requests.map((request: any) => ({
      id: request._id,
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      requestedAt: request.requestedAt,
      status: request.status
    }));
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
    throw error;
  }
}

export async function createCancellationRequest(request: Omit<CancellationRequestData, 'id' | 'requestedAt' | 'status'>): Promise<CancellationRequestData> {
  try {
    const response = await fetch('/api/cancellation-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create request');
    }
    
    return {
      id: data.request._id,
      userId: data.request.userId,
      userName: data.request.userName,
      userEmail: data.request.userEmail,
      serviceId: data.request.serviceId,
      serviceName: data.request.serviceName,
      requestedAt: data.request.requestedAt,
      status: data.request.status
    };
  } catch (error) {
    console.error('Error creating cancellation request:', error);
    throw error;
  }
}

export async function updateCancellationRequestStatus(id: string): Promise<CancellationRequestData> {
  try {
    const response = await fetch(`/api/cancellation-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'processed' }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update request');
    }
    
    return {
      id: data.request._id,
      userId: data.request.userId,
      userName: data.request.userName,
      userEmail: data.request.userEmail,
      serviceId: data.request.serviceId,
      serviceName: data.request.serviceName,
      requestedAt: data.request.requestedAt,
      status: data.request.status
    };
  } catch (error) {
    console.error('Error updating cancellation request:', error);
    throw error;
  }
}

export async function deleteAllCancellationRequests(): Promise<void> {
  try {
    const response = await fetch('/api/cancellation-requests', {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete requests');
    }
  } catch (error) {
    console.error('Error deleting cancellation requests:', error);
    throw error;
  }
}

// User Services
export async function fetchUserServices(userId: string): Promise<UserSubscribedServiceData[]> {
  try {
    const response = await fetch(`/api/user-services?userId=${userId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user services');
    }
    
    return data.userServices.map((userService: any) => ({
      id: userService._id,
      userId: userService.userId,
      serviceId: userService.serviceId,
      status: userService.status,
      activatedAt: userService.activatedAt,
      createdAt: userService.createdAt
    }));
  } catch (error) {
    console.error('Error fetching user services:', error);
    throw error;
  }
}

export async function updateUserService(userId: string, serviceId: string, status: 'pending_activation' | 'active' | 'pending_cancellation'): Promise<UserSubscribedServiceData> {
  try {
    const response = await fetch('/api/user-services', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, serviceId, status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update user service');
    }
    
    return {
      id: data.userService._id,
      userId: data.userService.userId,
      serviceId: data.userService.serviceId,
      status: data.userService.status,
      activatedAt: data.userService.activatedAt,
      createdAt: data.userService.createdAt
    };
  } catch (error) {
    console.error('Error updating user service:', error);
    throw error;
  }
}

export async function createUserService(userId: string, serviceId: string, status: 'pending_activation' | 'active' | 'pending_cancellation' = 'pending_activation'): Promise<UserSubscribedServiceData> {
  try {
    const response = await fetch('/api/user-services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, serviceId, status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create user service');
    }
    
    return {
      id: data.userService._id,
      userId: data.userService.userId,
      serviceId: data.userService.serviceId,
      status: data.userService.status,
      activatedAt: data.userService.activatedAt,
      createdAt: data.userService.createdAt
    };
  } catch (error) {
    console.error('Error creating user service:', error);
    throw error;
  }
}
