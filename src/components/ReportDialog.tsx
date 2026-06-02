import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Flag } from 'lucide-react';

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Fake Profile',
  'Inappropriate Content',
  'Other',
] as const;

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onSubmit: (reason: string, description: string) => void;
}

export default function ReportDialog({
  open,
  onOpenChange,
  userName,
  onSubmit,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, description);
    setSelectedReason('');
    setDescription('');
    onOpenChange(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelectedReason('');
      setDescription('');
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-[340px] rounded-[20px] border-0 p-6 gap-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        showCloseButton={true}
      >
        <DialogHeader className="gap-3 mb-5">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: 'rgba(232,106,106,0.1)' }}>
            <Flag size={24} style={{ color: '#E86A6A' }} />
          </div>
          <DialogTitle
            className="text-center text-xl font-semibold"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              color: '#232323',
            }}
          >
            Report {userName}
          </DialogTitle>
          <DialogDescription
            className="text-center text-sm"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              color: 'rgba(35,35,35,0.6)',
            }}
          >
            Help us keep our community safe. Your report will be reviewed.
          </DialogDescription>
        </DialogHeader>

        {/* Report reasons */}
        <div className="mb-4">
          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="gap-2"
          >
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                htmlFor={`reason-${reason}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
                style={{
                  backgroundColor: selectedReason === reason ? 'rgba(187,131,201,0.08)' : '#F7F4EE',
                  border: selectedReason === reason ? '1.5px solid #BB83C9' : '1.5px solid transparent',
                }}
              >
                <RadioGroupItem
                  value={reason}
                  id={`reason-${reason}`}
                  className="shrink-0"
                  style={{
                    borderColor: selectedReason === reason ? '#BB83C9' : '#E8E2D8',
                  }}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    color: '#232323',
                  }}
                >
                  {reason}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Optional description */}
        <div className="mb-5">
          <label
            className="text-xs font-semibold uppercase tracking-wider mb-2 block"
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              color: 'rgba(35,35,35,0.5)',
              letterSpacing: '0.44px',
            }}
          >
            Description (optional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setDescription(e.target.value);
              }
            }}
            placeholder="Tell us more about the issue..."
            className="rounded-xl border-0 resize-none text-sm"
            style={{
              backgroundColor: 'rgba(232,226,216,0.4)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              color: '#232323',
              minHeight: 80,
            }}
          />
          <div
            className="text-right text-xs mt-1"
            style={{ color: 'rgba(35,35,35,0.35)' }}
          >
            {description.length}/200
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedReason}
          className="w-full h-14 rounded-full text-base font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#E86A6A',
            boxShadow: '0 4px 16px rgba(232,106,106,0.3)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          Submit Report
        </button>
      </DialogContent>
    </Dialog>
  );
}
