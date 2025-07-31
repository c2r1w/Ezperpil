"use client";
import React, { useState } from 'react';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';

export default function TestUploadPage() {
  const [formValue, setFormValue] = useState<string | null>(null);

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Test File Upload Input</h1>
     <div className="w-[400px]">
      <FileUploadDialog
        valuex={formValue}
        onChange={setFormValue}
        isImage={true}
        
        placeholder="Click to upload"
        disabled={false}
      /></div>
    </div>
  );
}