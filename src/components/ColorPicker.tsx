interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const colors: string[] = [
    '#8B5CF6',
    '#D946EF',
    '#F97316',
    '#0EA5E9',
    '#8E9196',
    '#22C55E',
    '#EF4444',
    '#F59E0B',
  ];

  return (
    <div className="grid grid-cols-4 gap-2 p-2 bg-background rounded-lg">
      {colors.map((color) => (
        <button
          key={color}
          className={`h-6 w-6 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${ // Improved focus
            color === value
              ? 'scale-110 shadow-lg border-white'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Select color ${color}`} // Accessibility
        >
          {color === value && <span className="sr-only">Selected</span>} {/* Screen reader */}
        </button>
      ))}
    </div>
  );
}