/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // legacy aliases (masih dipakai beberapa modul)
        bg:'#FAFAFA', card:'#FFFFFF', card2:'#F4F4F5', line:'#E4E4E7',
        ink:'#18181B', inksoft:'#52525B', dim:'#A1A1AA',
        blue:{DEFAULT:'#4F46E5',dark:'#4338CA',soft:'#EEF0FB'},
        green:{DEFAULT:'#16A34A',soft:'#ECFDF3'},
        gold:{DEFAULT:'#D97706',soft:'#FEF3E2'},
        amber:{DEFAULT:'#D97706',soft:'#FEF3E2'},
        red:{DEFAULT:'#DC2626',soft:'#FDECEC'},
        violet:{DEFAULT:'#4F46E5',soft:'#EEF0FB'},
        // palet editorial Kerja Sama
        canvas:'#FAFAFA', surface:'#FFFFFF', subtle:'#F4F4F5', hairline:'#E4E4E7',
        indigo2:'#4F46E5',
        border:'hsl(var(--border))',
        input:'hsl(var(--input))',
        ring:'hsl(var(--ring))',
        background:'hsl(var(--background))',
        foreground:'hsl(var(--foreground))',
        primary:{ DEFAULT:'hsl(var(--primary))', foreground:'hsl(var(--primary-foreground))' },
        secondary:{ DEFAULT:'hsl(var(--secondary))', foreground:'hsl(var(--secondary-foreground))' },
        destructive:{ DEFAULT:'hsl(var(--destructive))', foreground:'hsl(var(--destructive-foreground))' },
        muted:{ DEFAULT:'hsl(var(--muted))', foreground:'hsl(var(--muted-foreground))' },
        accent:{ DEFAULT:'hsl(var(--accent))', foreground:'hsl(var(--accent-foreground))' },
        popover:{ DEFAULT:'hsl(var(--popover))', foreground:'hsl(var(--popover-foreground))' },
      },
      fontFamily: { sans:['Inter','-apple-system','sans-serif'], disp:['Inter','sans-serif'], body:['Inter','sans-serif'], mono:['"JetBrains Mono"','monospace'] },
      boxShadow: {
        hairline:'0 1px 2px 0 rgba(24, 24, 27, 0.03)',
        float:'0 12px 32px -4px rgba(24, 24, 27, 0.08), 0 0 0 1px rgba(228, 228, 231, 0.8)',
        soft:'0 1px 2px 0 rgba(24, 24, 27, 0.03)',
        pop:'0 12px 32px -4px rgba(24,24,27,.14)',
      },
      borderRadius: { lg:'var(--radius)', md:'calc(var(--radius) - 2px)', sm:'calc(var(--radius) - 4px)' },
      keyframes: {
        'overlay-in': { from:{opacity:0}, to:{opacity:1} },
        'content-in': { from:{opacity:0,transform:'translate(-50%,-48%) scale(.96)'}, to:{opacity:1,transform:'translate(-50%,-50%) scale(1)'} },
        'pop-in': { from:{opacity:0,transform:'scale(.95)'}, to:{opacity:1,transform:'scale(1)'} },
      },
      animation: {
        'overlay-in':'overlay-in .15s ease-out',
        'content-in':'content-in .18s ease-out',
        'pop-in':'pop-in .12s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
