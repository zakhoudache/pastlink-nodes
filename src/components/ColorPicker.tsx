interface ColorPickerProps {
    value: string; // Assuming string for hex color
    onChange: (color: string) => void;
  }
  
  export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const colors: string[] = ['#FFEB3B', '#90CAF9', '#A5D6A7', '#FFF59D', '#CE93D8'];
  
    return (
      <div className="flex gap-2 p-2 bg-background rounded-lg">
        {colors.map((color) => (
          <button
            key={color}
            className={`h-8 w-8 rounded-full border-2 transition-all ${
              color === value ? 'scale-110 shadow-lg' : 'scale-100'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    );
  }