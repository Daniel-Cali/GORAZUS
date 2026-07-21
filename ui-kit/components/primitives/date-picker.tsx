import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import 'react-day-picker/style.css';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const formatEs = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Selector de fecha único del sistema (docs/frontend/UI_GUIDELINES.md) — envuelve `react-day-picker`, ningún módulo lo importa directo. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Elegí una fecha',
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatEs.format(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <DayPicker
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={undefined}
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}
