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
  const [zoom, setZoom] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(1.414); // Default to A4

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNumPages(0);
    setPageNumber(1);
    setZoom(1.0);
    setLoading(true);
    setError(null);
  }, [url]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setContainerWidth(width);
      setContainerHeight(height);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);

    // Get aspect ratio of the first page
    try {
      const pdf = await pdfjs.getDocument(url).promise;
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageAspectRatio(viewport.height / viewport.width);
    } catch (e) {
      console.error('Error getting page aspect ratio:', e);
    }
  }

  function onDocumentLoadError(err: Error) {
    console.error('Error loading PDF:', err);
    setLoading(false);
    setError('Falha ao carregar o PDF. O arquivo pode estar corrompido ou inacessível.');
  }

  function previousPage() {
    setPageNumber((p) => Math.max(1, p - 1));
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function nextPage() {
    setPageNumber((p) => Math.min(numPages || 1, p + 1));
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function zoomIn() {
    setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))));
  }

  function zoomOut() {
    setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))));
  }

  // Calculate the scale needed to fit the page perfectly into the available container space
  // Subtracting toolbar (approx 48px) and padding (32px)
  const availableHeight = Math.max(0, containerHeight - 48 - 32);
  const availableWidth = Math.max(0, containerWidth - 32);
  
  // Width needed to fit the full page height based on aspect ratio
  const widthToFitHeight = availableHeight / pageAspectRatio;
  
  // Base width at 100% zoom should be the best fit (contain) within both width and height
  // This ensures the user doesn't have to scroll at 100% magnification
  const baseWidth = Math.min(availableWidth, widthToFitHeight);
  
  const renderWidth = baseWidth > 0 ? Math.floor(baseWidth * zoom) : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col w-full h-full bg-card rounded-lg overflow-hidden border border-border shadow-sm",
        className,
      )}
    >
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
            {Math.round(zoom * 100)}%
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
      <div className="flex-1 relative overflow-hidden h-full min-h-0">
        {/* Floating Side Buttons - Now relative to the VIEWPORT, not the PDF content */}
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
          style={{ scrollbarGutter: 'stable' }}
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
                  width={renderWidth}
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
