// Utility functions for webinar template state management

export interface Template {
  id: string;
  type: "video" | "text";
  title: string;
  description: string;
  presenter: string;
  date: string;
  active: boolean;
  sponsor: string | null;
  linkGenerated: boolean;
}

// Fetch all template states for a user
export const fetchTemplateStates = async (userId: string): Promise<Template[]> => {
  try {
    const res = await fetch(`/api/webinar-template-states?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch template states');
    const result = await res.json();
    if (result.success && Array.isArray(result.templates)) {
      return result.templates;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Could not fetch template states from DB', error);
    return [];
  }
};

// Save all template states for a user (bulk update)
export const saveTemplateStates = async (userId: string, templates: Template[]): Promise<boolean> => {
  try {
    const res = await fetch('/api/webinar-template-states', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, templates }),
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Could not save template states to DB', error);
    return false;
  }
};

// Update a specific template state
export const updateTemplateState = async (userId: string, templateId: string, updates: Partial<Template>): Promise<boolean> => {
  try {
    const res = await fetch(`/api/webinar-template-states/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates }),
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Could not update template state', error);
    return false;
  }
};

// Create a new template state
export const createTemplateState = async (userId: string, template: Template): Promise<boolean> => {
  try {
    const res = await fetch('/api/webinar-template-states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        templateId: template.id,
        type: template.type,
        title: template.title,
        description: template.description,
        presenter: template.presenter,
        date: template.date,
        active: template.active,
        sponsor: template.sponsor,
        linkGenerated: template.linkGenerated,
      }),
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Could not create template state', error);
    return false;
  }
};

// Delete a template state
export const deleteTemplateState = async (userId: string, templateId: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/webinar-template-states/${templateId}?userId=${userId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Could not delete template state', error);
    return false;
  }
};
