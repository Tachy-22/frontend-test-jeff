import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocument } from '@/contexts/DocumentContext';
import { FileText, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const DocumentUpload: React.FC = () => {
  const { setFile } = useDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setFile(file);
    toast({
      title: "File uploaded",
      description: `${file.name} has been uploaded successfully`,
    });
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <label htmlFor="file-upload" className="sr-only">
          Upload PDF document
        </label>
        <input {...getInputProps()} id="file-upload" aria-describedby="file-upload-description" />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            {isDragActive ? (
              <Upload className="h-12 w-12 text-primary" />
            ) : (
              <FileText className="h-12 w-12 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium" id="file-upload-description">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF file'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Or click to browse your files
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Only PDF files are supported
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Need a sample document to try? Download a sample PDF
        </p>
        <Button
          variant="outline"
          onClick={() => {
            // In a real application, we would provide a sample PDF
            toast({
              title: "Sample PDF",
              description: "This feature is not implemented in this demo.",
            });
          }}
        >
          Download Sample
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
