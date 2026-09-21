// Optional rebuild: npx tailwindcss@3.4.17 -i assets/tailwind-input.css -o assets/tailwind.css --minify
module.exports = {
            content: ['./index.html', './assets/content.js', './assets/site.js'],
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        tech: {
                            dark: '#0b1120', 
                            surface: '#1e293b',
                            accent: '#00f2ea', 
                            secondary: '#a5b4fc', 
                            text: '#e2e8f0'
                        }
                    },
                    animation: {
                        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'glow': 'glow 2s ease-in-out infinite alternate',
                        'float': 'float 6s ease-in-out infinite',
                    },
                    keyframes: {
                        glow: {
                            '0%': { boxShadow: '0 0 5px #00f2ea, 0 0 10px #00f2ea' },
                            '100%': { boxShadow: '0 0 20px #00f2ea, 0 0 30px #00f2ea' },
                        },
                        float: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-20px)' },
                        }
                    }
                }
            }
        };
