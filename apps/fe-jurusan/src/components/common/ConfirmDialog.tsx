import { Modal } from '@widyatama/ui';
import { Button } from '@widyatama/ui';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Konfirmasi', description = 'Apakah Anda yakin ingin melanjutkan?', confirmLabel = 'Ya, Lanjutkan', cancelLabel = 'Batal', loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={onClose} title={title}>
      <div className="flex items-start gap-4 py-2">
        <div className="p-2 bg-red-100 rounded-full text-red-600"><AlertTriangle size={20} /></div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>{loading ? 'Memproses...' : confirmLabel}</Button>
      </div>
    </Modal>
  );
}
