/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))',
  				blue: 'hsl(var(--accent-blue))',
  				'blue-foreground': 'hsl(var(--accent-blue-foreground))',
  				green: 'hsl(var(--accent-green))',
  				'green-foreground': 'hsl(var(--accent-green-foreground))',
  				purple: 'hsl(var(--accent-purple))',
  				'purple-foreground': 'hsl(var(--accent-purple-foreground))',
  				orange: 'hsl(var(--accent-orange))',
  				'orange-foreground': 'hsl(var(--accent-orange-foreground))',
  				red: 'hsl(var(--accent-red))',
  				'red-foreground': 'hsl(var(--accent-red-foreground))',
  				yellow: 'hsl(var(--accent-yellow))',
  				'yellow-foreground': 'hsl(var(--accent-yellow-foreground))',
  				pink: 'hsl(var(--accent-pink))',
  				'pink-foreground': 'hsl(var(--accent-pink-foreground))',
  				cyan: 'hsl(var(--accent-cyan))',
  				'cyan-foreground': 'hsl(var(--accent-cyan-foreground))',
  				indigo: 'hsl(var(--accent-indigo))',
  				'indigo-foreground': 'hsl(var(--accent-indigo-foreground))',
  				teal: 'hsl(var(--accent-teal))',
  				'teal-foreground': 'hsl(var(--accent-teal-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
