import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  confirmation: AlertCircle,
};

const colorMap = {
  success: 'text-green-500',
  error: 'text-destructive',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  confirmation: 'text-amber-500',
};

const Modal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  onConfirm, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar' 
}: ModalProps) => {
  const Icon = iconMap[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-enter">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <Icon className={`h-6 w-6 ${colorMap[type]}`} />
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-3 mt-6">
          {type === 'confirmation' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
              <Button onClick={onConfirm}>
                {confirmText}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="px-8">
              OK
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;