import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl?: string;
  fileName?: string;
  buttonClassName?: string;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonVariant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive';
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  fileName = 'Document.pdf',
  buttonClassName,
  buttonSize = 'sm',
  buttonVariant = 'ghost',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize URL to ensure it starts with / for proper path resolution
  const normalizedUrl = pdfUrl && !pdfUrl.startsWith('/') && !pdfUrl.startsWith('http')
    ? '/' + pdfUrl
    : pdfUrl;

  const handleDownload = async () => {
    if (!normalizedUrl) return;
    try {
      const response = await fetch(normalizedUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download PDF', error);
    }
  };

  if (!normalizedUrl) {
    return null;
  }

  return (
    <>
      <Button
        size={buttonSize}
        variant={buttonVariant}
        onClick={() => setIsOpen(true)}
        className={buttonClassName}
        title={`View ${fileName}`}
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-center gap-4 pr-8">
              <DialogTitle>{fileName}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <iframe
              src={normalizedUrl}
              className="w-full h-full"
              title={fileName}
              style={{ minHeight: '600px' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PDFViewer;
