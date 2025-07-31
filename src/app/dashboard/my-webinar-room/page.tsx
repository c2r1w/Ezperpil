
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check, Eye, LayoutTemplate, Pencil, Plus, Presentation, Settings, Trash2, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTemplateStates, saveTemplateStates, updateTemplateState, createTemplateState, deleteTemplateState } from '@/lib/webinar-templates';
import type { Template as WebinarTemplate } from '@/lib/webinar-templates';

type Template = WebinarTemplate;

// Mock data based on the image provided
const initialTemplates: Template[] = [
  {
    id: "video-template-1",
    type: "video",
    title: "Nueva Herramienta para explotar cualquier negocio",
    description: "Scale Your Business with Proven Techniques",
    presenter: "Eddie Partida",
    date: "2024-12-20 at 16:00",
    active: true,
    sponsor: null,
    linkGenerated: false,
  },
  {
    id: "text-template-1",
    type: "text",
    title: "Amazing way to connect with people",
    description: "Transform Your Online Presence in 60 Minutes",
    presenter: "Eddie Partida",
    date: "2025-06-22 at 19:00",
    active: false,
    sponsor: "Ezperfil1",
    linkGenerated: true,
  },
];

interface UserData {
  role?: 'admin' | 'client' | 'user';
}

export default function MyWebinarRoomPage() {
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [templatesLoading, setTemplatesLoading] = React.useState(true);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<'create' | 'clone' | null>(null);
  const [templateToClone, setTemplateToClone] = React.useState<Template | null>(null);
  const [adminCode, setAdminCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Form fields for template creation/editing
  const [templateForm, setTemplateForm] = React.useState({
    templateId: '',
    title: '',
    description: '',
    presenter: '',
    date: '',
    type: 'video' as 'video' | 'text',
  });
  
  const [templateList, setTemplateList] = React.useState<Template[]>([]);

  // Validation functions
  const validateTemplateId = (id: string): string | null => {
    if (!id.trim()) return 'Template ID is required';
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return 'Template ID can only contain letters, numbers, hyphens (-), and underscores (_)';
    if (id.includes(' ')) return 'Template ID cannot contain spaces';
    return null;
  };

  const checkTemplateIdExists = (id: string): boolean => {
    return templateList.some(template => template.id === id);
  };

  React.useEffect(() => {
    const loadTemplates = async () => {
      if (!user) {
        setTemplatesLoading(false);
        return;
      }

      setTemplatesLoading(true);
      try {
        const fetchedTemplates = await fetchTemplateStates(user.uid);
        if (fetchedTemplates && fetchedTemplates.length > 0) {
          setTemplateList(fetchedTemplates);
        } else {
          // If no templates in DB, initialize with default templates and save them
          setTemplateList(initialTemplates);
          await saveTemplateStates(user.uid, initialTemplates);
        }
      } catch (error) {
        console.error("Could not load template states from MongoDB", error);
        setTemplateList(initialTemplates); // Fallback
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

  const handleToggleActive = async (id: string, newActiveState: boolean) => {
    if (!user) return;

    // Optimistically update the UI
    setTemplateList(currentTemplates => {
      return currentTemplates.map(t => 
        t.id === id ? { ...t, active: newActiveState } : t
      );
    });

    try {
      // Update in MongoDB
      const success = await updateTemplateState(user.uid, id, { active: newActiveState });
      if (success) {
        toast({
          title: "Template Updated",
          description: `The template has been ${newActiveState ? 'activated' : 'deactivated'}.`,
        });
      } else {
        // Revert on failure
        setTemplateList(currentTemplates => {
          return currentTemplates.map(t => 
            t.id === id ? { ...t, active: !newActiveState } : t
          );
        });
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update the template. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error updating template state:", error);
      // Revert on error
      setTemplateList(currentTemplates => {
        return currentTemplates.map(t => 
          t.id === id ? { ...t, active: !newActiveState } : t
        );
      });
      toast({
        variant: "destructive",
        title: "Update Failed", 
        description: "Could not update the template. Please try again.",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await deleteTemplateState(user.uid, templateId);
      if (success) {
        // Remove from local state
        setTemplateList(current => current.filter(t => t.id !== templateId));
        toast({
          title: "Template Deleted",
          description: `"${templateTitle}" has been deleted successfully.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Could not delete the template. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "An error occurred while deleting the template.",
      });
    }
  };

  React.useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load user data.",
          });
        }
      }
      setDataLoading(false);
    };

    if (!authLoading) {
      fetchUserData();
    }
  }, [user, authLoading, toast]);

  const handleCreateClick = () => {
    if (userData?.role === 'admin') {
      setActionType('create');
      setTemplateToClone(null);
      setAdminCode('');
      // Initialize form with default values
      setTemplateForm({
        templateId: `template-${Date.now()}`,
        title: 'New Template',
        description: 'A new webinar template ready for customization',
        presenter: userData?.role === 'admin' ? 'Admin User' : 'User',
        date: new Date().toISOString().split('T')[0] + ' at 16:00',
        type: 'video',
      });
      setIsDialogOpen(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only administrators can create new templates.',
      });
    }
  };

  const handleCloneClick = (template: Template) => {
    setActionType('clone');
    setTemplateToClone(template);
    setAdminCode('');
    // Initialize form with template data
    setTemplateForm({
      templateId: `${template.id}-clone-${Date.now()}`,
      title: `${template.title} (Copy)`,
      description: template.description,
      presenter: template.presenter,
      date: template.date,
      type: template.type,
    });
    setIsDialogOpen(true);
  };
  
  const handleCodeSubmit = async () => {
    if (adminCode !== '1970') {
      toast({
        variant: 'destructive',
        title: 'Incorrect Code',
        description: 'The admin code you entered is incorrect. Please try again.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated.',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Validate template ID
    const idValidationError = validateTemplateId(templateForm.templateId);
    if (idValidationError) {
      toast({
        variant: 'destructive',
        title: 'Invalid Template ID',
        description: idValidationError,
      });
      setIsSubmitting(false);
      return;
    }

    // Check if template ID already exists
    if (checkTemplateIdExists(templateForm.templateId)) {
      toast({
        variant: 'destructive',
        title: 'Template ID Already Exists',
        description: 'Please choose a different template ID. This ID is already in use.',
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (actionType === 'create') {
        // Create a new template with form data
        const newTemplate: Template = {
          id: templateForm.templateId,
          type: templateForm.type,
          title: templateForm.title,
          description: templateForm.description,
          presenter: templateForm.presenter,
          date: templateForm.date,
          active: false,
          sponsor: null,
          linkGenerated: false,
        };

        const success = await createTemplateState(user.uid, newTemplate);
        if (success) {
          // Add to local state
          setTemplateList(current => [...current, newTemplate]);
          toast({
            title: 'Success!',
            description: 'New template created. You can now edit it.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create template. Please try again.',
          });
        }
      } else if (actionType === 'clone' && templateToClone) {
        // Clone the selected template with form data
        const clonedTemplate: Template = {
          ...templateToClone,
          id: templateForm.templateId,
          title: templateForm.title,
          description: templateForm.description,
          presenter: templateForm.presenter,
          date: templateForm.date,
          type: templateForm.type,
          active: false, // New clones start inactive
          linkGenerated: false, // Reset link generation
        };

        const success = await createTemplateState(user.uid, clonedTemplate);
        if (success) {
          // Add to local state
          setTemplateList(current => [...current, clonedTemplate]);
          toast({
            title: 'Success!',
            description: `Template "${templateToClone.title}" has been cloned.`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to clone template. Please try again.',
          });
        }
      }
    } catch (error) {
      console.error('Error in template operation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      setAdminCode('');
    }
  };

  if (authLoading || dataLoading || templatesLoading) {
     return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-40" />
            </div>
             <div className="rounded-lg border bg-card text-card-foreground p-6">
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="space-y-4">
                 <Skeleton className="h-6 w-48 mb-4" />
                 <Card className="p-6"><Skeleton className="h-20 w-full" /></Card>
                 <Card className="p-6"><Skeleton className="h-20 w-full" /></Card>
            </div>
        </div>
     );
  }

  return (
    <>
      <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create a Webinar</h1>
          <p className="text-muted-foreground">
            Manage create a webinar settings and content
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button>
            <LayoutTemplate className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button variant="ghost">
            <Presentation className="mr-2 h-4 w-4" />
            Webinar Creator
          </Button>
          <Button variant="ghost">
            <Settings className="mr-2 h-4 w-4" />
            Global Settings
          </Button>
        </div>

        {/* Template Management */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-card text-card-foreground p-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Template Management</h2>
            <p className="text-muted-foreground">
              Create and manage webinar templates with visual editor
            </p>
          </div>
          <Button onClick={handleCreateClick} disabled={userData?.role !== 'admin'}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
        
        {/* Existing Templates */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Existing Templates</h3>
          <div className="grid gap-4">
            {templateList.map((template, index) => (
              <Card key={index} className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h4 className="text-lg font-semibold">{template.title}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Presenter: {template.presenter} | {template.date}
                    </p>
                    {template.sponsor && (
                      <p className="text-sm font-semibold text-primary">Sponsor: {template.sponsor}</p>
                    )}
                    {template.linkGenerated && (
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <Check className="h-4 w-4" />
                        <span>Enlace compartible generado</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                      <Switch 
                        checked={template.active} 
                        onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                      />
                      <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCloneClick(template)}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Clone</span>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/my-webinar-room/edit?id=${template.id}`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTemplate(template.id, template.title)}
                      >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                      </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>
                    {actionType === 'create' ? 'Create New Template' : 'Clone Template'}
                  </DialogTitle>
                  <DialogDescription>
                      {actionType === 'create' 
                          ? "Enter details for your new webinar template and admin code to create it."
                          : "Modify the template details and enter admin code to clone it."
                      }
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-id" className="text-right">
                          Template ID
                      </Label>
                      <Input
                          id="template-id"
                          value={templateForm.templateId}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''); // Remove invalid characters
                            setTemplateForm(prev => ({ ...prev, templateId: value }));
                          }}
                          className="col-span-3"
                          placeholder="template-unique-id"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-type" className="text-right">
                          Type
                      </Label>
                      <Select 
                        value={templateForm.type} 
                        onValueChange={(value: 'video' | 'text') => 
                          setTemplateForm(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select template type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-title" className="text-right">
                          Title
                      </Label>
                      <Input
                          id="template-title"
                          value={templateForm.title}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                          className="col-span-3"
                          placeholder="Enter template title"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="template-description" className="text-right pt-2">
                          Description
                      </Label>
                      <Textarea
                          id="template-description"
                          value={templateForm.description}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                          className="col-span-3"
                          placeholder="Enter template description"
                          rows={3}
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-presenter" className="text-right">
                          Presenter
                      </Label>
                      <Input
                          id="template-presenter"
                          value={templateForm.presenter}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, presenter: e.target.value }))}
                          className="col-span-3"
                          placeholder="Enter presenter name"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="template-date" className="text-right">
                          Date & Time
                      </Label>
                      <Input
                          id="template-date"
                          value={templateForm.date}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, date: e.target.value }))}
                          className="col-span-3"
                          placeholder="YYYY-MM-DD at HH:MM"
                      />
                  </div>
                  <div className="border-t pt-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="admin-code" className="text-right">
                              Admin Code
                          </Label>
                          <Input
                              id="admin-code"
                              type="password"
                              value={adminCode}
                              onChange={(e) => setAdminCode(e.target.value)}
                              className="col-span-3"
                              placeholder="Enter admin code"
                          />
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button 
                    type="submit" 
                    onClick={handleCodeSubmit} 
                    disabled={isSubmitting || !templateForm.templateId.trim() || !templateForm.title.trim() || !templateForm.description.trim() || !templateForm.presenter.trim() || !templateForm.date.trim()}
                  >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {actionType === 'create' ? 'Create Template' : 'Clone Template'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
