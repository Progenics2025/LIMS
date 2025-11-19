import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      value ? formatINR(value) : ''
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatINR(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
      
      if (isNaN(numericValue)) {
        onValueChange?.(undefined);
        setDisplayValue('');
      } else {
        onValueChange?.(numericValue);
        setDisplayValue(formatINR(numericValue));
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          ₹
        </span>
        <Input
          {...props}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          className={cn("pl-8", className)}
          placeholder="0.00"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '');
}

export { CurrencyInput };
