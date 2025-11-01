export type ColorPalette = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export function initializeColorPalette() {
  // Get saved palette from localStorage
  const savedPalette = localStorage.getItem('color-palette') as ColorPalette;
  
  if (savedPalette && ['blue', 'green', 'purple', 'orange', 'red'].includes(savedPalette)) {
    // Remove any existing palette classes
    document.documentElement.classList.remove(
      'palette-blue',
      'palette-green', 
      'palette-purple',
      'palette-orange',
      'palette-red'
    );
    
    // Apply the saved palette
    document.documentElement.classList.add(`palette-${savedPalette}`);
  } else {
    // Default to blue palette
    document.documentElement.classList.add('palette-blue');
  }
}

export function getCurrentPalette(): ColorPalette {
  const currentClass = document.documentElement.className;
  const paletteMatch = currentClass.match(/palette-(\w+)/);
  return (paletteMatch?.[1] as ColorPalette) || 'blue';
}

export function setPalette(palette: ColorPalette) {
  // Remove existing palette classes
  document.documentElement.classList.remove(
    'palette-blue',
    'palette-green', 
    'palette-purple',
    'palette-orange',
    'palette-red'
  );
  
  // Add new palette class
  document.documentElement.classList.add(`palette-${palette}`);
  
  // Store preference
  localStorage.setItem('color-palette', palette);
}