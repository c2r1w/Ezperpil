import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

interface FileUploadDialogProps {
  valuex?: string | null;
  onChange?: (fileName: string | null) => void;
inpname?: string;
  isImage?: boolean;
  placeholder?: string;
  disabled?: boolean;
}


export const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  valuex,
  onChange,
  isImage = false,
  inpname,
  placeholder = 'Click to upload',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [value, setValue] = useState<string | null>(valuex || null);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadedFileName(null);
    if (isImage && selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    setError(null);
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const { fileName } = JSON.parse(xhr.responseText);
        setUploadedFileName(fileName);
      } else {
        setError('Upload failed. Please try again.');
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError('Upload failed. Please check your connection.');
    };
    xhr.send(formData);
  };

  const handleOk = () => {
    if (uploadedFileName) {
      if (onChange) onChange(uploadedFileName);
      setValue(uploadedFileName);
      setOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setUploadedFileName(null);
      setProgress(0);
      setError(null);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFile(null);
    setPreviewUrl(null);
    setUploadedFileName(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {!value ? (
          <Input
            type="text"
            value={value || ''}
            name={inpname|| ''}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            onClick={() => !disabled && setOpen(true)}
            className="cursor-pointer bg-white"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">{value}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={disabled}
              aria-label="Reupload"
              className="p-2 bg-yellow-500"
            >
              {/* Reload icon (SVG) */}
             <div className="recycle-icon "></div>
            </Button>
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">Upload {isImage ? 'Image' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select {isImage ? 'an image' : 'a file'} to upload</label>
            <Input type="file" accept={isImage ? 'image/*' : undefined} onChange={handleFileChange} aria-label="File input" />
            {isImage && previewUrl && (
              <div className="flex justify-center">
                <img src={previewUrl} alt="Preview" className="w-48 h-48 object-contain rounded border shadow" />
              </div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {uploading && (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-full" />
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
            )}
            {uploadedFileName && (
              <div className="text-green-600 text-sm font-medium">Uploaded: {uploadedFileName}</div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button type="button" onClick={handleUpload} disabled={!file || uploading} className="px-4">
                {uploadedFileName ? 'Reupload' : uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} className="px-4">Cancel</Button>
              <Button type="button" onClick={handleOk} disabled={!uploadedFileName} className="px-4">OK</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
