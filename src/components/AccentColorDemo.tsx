import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  Calendar, 
  MessageSquare,
  FileText,
  Settings,
  Bell,
  Star
} from 'lucide-react';

export function AccentColorDemo() {
  const accentColors = [
    { name: 'Blue', class: 'accent-blue', icon: BookOpen },
    { name: 'Green', class: 'accent-green', icon: TrendingUp },
    { name: 'Purple', class: 'accent-purple', icon: Award },
    { name: 'Orange', class: 'accent-orange', icon: Calendar },
    { name: 'Red', class: 'accent-red', icon: Bell },
    { name: 'Yellow', class: 'accent-yellow', icon: Star },
    { name: 'Pink', class: 'accent-pink', icon: MessageSquare },
    { name: 'Cyan', class: 'accent-cyan', icon: FileText },
    { name: 'Indigo', class: 'accent-indigo', icon: Users },
    { name: 'Teal', class: 'accent-teal', icon: Settings },
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Enhanced Accent Color Palette</h2>
        <p className="text-muted-foreground">
          Now you have 10 vibrant accent colors to use throughout your UI, not just for logos!
        </p>
      </div>

      {/* Badges Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color Badges</CardTitle>
          <CardDescription>Perfect for status indicators, categories, and tags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {accentColors.map((color) => (
              <Badge 
                key={color.name}
                className={`bg-${color.class} text-${color.class}-foreground hover:bg-${color.class}/80`}
              >
                {color.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buttons Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color Buttons</CardTitle>
          <CardDescription>Use for call-to-action buttons and interactive elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {accentColors.map((color) => {
              const Icon = color.icon;
              return (
                <Button 
                  key={color.name}
                  className={`bg-${color.class} text-${color.class}-foreground hover:bg-${color.class}/90`}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {color.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Icon Backgrounds Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color Icon Backgrounds</CardTitle>
          <CardDescription>Great for feature highlights and navigation elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
            {accentColors.map((color) => {
              const Icon = color.icon;
              return (
                <div key={color.name} className="text-center">
                  <div className={`bg-${color.class} text-${color.class}-foreground w-12 h-12 rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-muted-foreground">{color.name}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Border Accents Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color Borders</CardTitle>
          <CardDescription>Subtle way to add color without overwhelming the design</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accentColors.slice(0, 6).map((color) => (
              <div 
                key={color.name}
                className={`p-4 border-l-4 border-${color.class} bg-card rounded-r-lg`}
              >
                <h4 className="font-semibold">{color.name} Feature</h4>
                <p className="text-sm text-muted-foreground">
                  This card uses {color.name.toLowerCase()} as a border accent color.
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use These Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Tailwind Classes:</h4>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
              <div>Background: <code>bg-accent-blue</code>, <code>bg-accent-green</code>, etc.</div>
              <div>Text: <code>text-accent-blue</code>, <code>text-accent-green</code>, etc.</div>
              <div>Border: <code>border-accent-blue</code>, <code>border-accent-green</code>, etc.</div>
              <div>Foreground: <code>text-accent-blue-foreground</code>, etc.</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">CSS Variables:</h4>
            <div className="bg-muted p-3 rounded-lg font-mono text-sm space-y-1">
              <div><code>hsl(var(--accent-blue))</code></div>
              <div><code>hsl(var(--accent-green))</code></div>
              <div><code>hsl(var(--accent-purple))</code></div>
              <div>And so on...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}