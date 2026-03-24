import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Configure PDF worker
// Using unpkg to load the worker script to avoid build configuration issues with Vite
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, title, className }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Responsive sizing
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        // Subtract padding (32px = 2rem)
        setContainerWidth(entries[0].contentRect.width - 32);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err);
    setLoading(false);
    setError('Falha ao carregar o PDF. O arquivo pode estar corrompido ou inacessível.');
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      const targetPage = Math.min(Math.max(1, newPage), numPages);
      
      // Only change page if it's different
      if (targetPage !== prevPageNumber) {
        // Scroll to the top of the viewer when page changes
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      
      return targetPage;
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col w-full bg-card rounded-lg overflow-hidden border border-border shadow-sm", className)}>
      {/* Toolbar - Sticky at top */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60 border-b border-border text-foreground shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={previousPage} 
            disabled={pageNumber <= 1 || loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[80px] text-center">
            {loading ? '...' : `${pageNumber} de ${numPages}`}
          </span>
          
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={nextPage} 
            disabled={pageNumber >= numPages || loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={zoomOut} 
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button 
            variant="ghost" 
            size="sm" 
            type="button"
            onClick={zoomIn} 
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden h-[600px]">
        {/* Floating Side Buttons - Fixed position relative to container */}
        {!loading && !error && (
          <>
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={(e) => { e.stopPropagation(); previousPage(); }}
              disabled={pageNumber <= 1}
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-50",
                "rounded-full shadow-lg transition-all duration-200 bg-background/80 hover:bg-background border border-border h-12 w-12",
                "opacity-50 hover:opacity-100 disabled:opacity-0" 
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={(e) => { e.stopPropagation(); nextPage(); }}
              disabled={pageNumber >= numPages}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-50",
                "rounded-full shadow-lg transition-all duration-200 bg-background/80 hover:bg-background border border-border h-12 w-12",
                "opacity-50 hover:opacity-100 disabled:opacity-0"
              )}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Document Container */}
        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto"
        >
          <div 
            id="pdf-content-container"
            className="w-full min-h-full flex justify-center p-4 bg-muted/20"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {error ? (
              <div className="flex flex-col items-center justify-center text-destructive p-8 text-center h-full">
                <p className="mb-2 font-semibold">Erro</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-64 w-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }
                className="flex flex-col items-center min-h-full"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale} 
                  width={containerWidth || undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg rounded-sm overflow-hidden mb-4"
                  loading={
                    <div className="h-[600px] w-[400px] bg-muted animate-pulse rounded flex items-center justify-center text-muted-foreground">
                      Carregando página...
                    </div>
                  }
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
