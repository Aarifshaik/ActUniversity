import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette } from 'lucide-react';
import { useTheme } from './theme-provider';

type ColorPalette = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export function ColorPaletteSelector() {
  const { palette: currentPalette, setPalette } = useTheme();

  const palettes: { name: ColorPalette; label: string; description: string }[] = [
    { name: 'blue', label: 'Ocean Blue', description: 'Professional and trustworthy' },
    { name: 'green', label: 'Nature Green', description: 'Fresh and growth-focused' },
    { name: 'purple', label: 'Royal Purple', description: 'Creative and premium' },
    { name: 'orange', label: 'Sunset Orange', description: 'Energetic and warm' },
    { name: 'red', label: 'Crimson Red', description: 'Bold and attention-grabbing' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <CardTitle>Color Palette</CardTitle>
        </div>
        <CardDescription>
          Choose a color theme that matches your preference. The background will have a subtle hue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {palettes.map((paletteOption) => (
            <Button
              key={paletteOption.name}
              variant={currentPalette === paletteOption.name ? "default" : "outline"}
              className={`h-auto p-3 flex flex-col items-start gap-2 ${
                currentPalette === paletteOption.name ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setPalette(paletteOption.name)}
            >
              <div className="flex items-center gap-2 w-full">
                <div 
                  className={`w-4 h-4 rounded-full ${
                    paletteOption.name === 'blue' ? 'bg-blue-500' :
                    paletteOption.name === 'green' ? 'bg-green-500' :
                    paletteOption.name === 'purple' ? 'bg-purple-500' :
                    paletteOption.name === 'orange' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                />
                <span className="font-medium text-sm">{paletteOption.label}</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                {paletteOption.description}
              </p>
              {currentPalette === paletteOption.name && (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Current:</strong> {palettes.find(p => p.name === currentPalette)?.label}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The background, cards, and sidebar now have a subtle {currentPalette} tint instead of pure white/black.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}