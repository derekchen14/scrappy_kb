import { useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

type Option<T extends string> = { label: string; value: T };

interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  label?: string;
  maxHeight?: number;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  label,
  maxHeight = 200,
  fullWidth = false,
  size = 'small',
}: CustomSelectProps<T>) {
  const idBase = useMemo(() => Math.random().toString(36).slice(2), []);

  const handleChange = (event: SelectChangeEvent<T>) => {
    onChange(event.target.value as T);
  };

  return (
    <FormControl fullWidth={fullWidth} size={size} className={className}>
      {label && <InputLabel id={`select-label-${idBase}`}>{label}</InputLabel>}
      <Select
        labelId={label ? `select-label-${idBase}` : undefined}
        id={`select-${idBase}`}
        value={value}
        label={label}
        onChange={handleChange}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: maxHeight,
            },
          },
        }}
        displayEmpty={!label}
      >
        {!label && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default CustomSelect;
