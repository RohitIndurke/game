const SVG_DEFS = `
<defs>
    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>
    <linearGradient id="beats-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff007f" />
        <stop offset="100%" stop-color="#ff4a5a" />
    </linearGradient>
    <linearGradient id="effects-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe" />
        <stop offset="100%" stop-color="#4facfe" />
    </linearGradient>
    <linearGradient id="melodies-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00e676" />
        <stop offset="100%" stop-color="#b9f6ca" />
    </linearGradient>
    <linearGradient id="vocals-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f50057" />
        <stop offset="100%" stop-color="#d500f9" />
    </linearGradient>
    <linearGradient id="skin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2d2b38" />
        <stop offset="100%" stop-color="#1b1a23" />
    </linearGradient>
    <linearGradient id="shades-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#111" />
        <stop offset="100%" stop-color="#333" />
    </linearGradient>
</defs>
`;

const ACCESSORIES: Record<string, string[]> = {
  beats: [
    `<path d="M70,45 L130,45 L125,58 L75,58 Z" fill="url(#shades-grad)" stroke="#ff2e63" stroke-width="2" filter="url(#neon-glow)" />
     <line x1="70" y1="45" x2="130" y2="45" stroke="#ff2e63" stroke-width="3" />
     <circle cx="85" cy="51" r="5" fill="#ff2e63" />
     <circle cx="115" cy="51" r="5" fill="#ff2e63" />
     <path d="M70,30 C70,10 130,10 130,30 Z" fill="#222" />
     <path d="M60,30 L140,30 L135,24 L65,24 Z" fill="#ff2e63" />`,
    `<path d="M62,45 C60,15 140,15 138,45" fill="none" stroke="#ff2e63" stroke-width="4" filter="url(#neon-glow)" />
     <rect x="54" y="38" width="12" height="22" rx="6" fill="#ff2e63" filter="url(#neon-glow)" />
     <rect x="134" y="38" width="12" height="22" rx="6" fill="#ff2e63" filter="url(#neon-glow)" />
     <path d="M75,90 C75,90 100,105 125,90 L120,98 C120,98 100,110 80,98 Z" fill="#111" stroke="#ff2e63" stroke-width="1.5" />`,
    `<rect x="68" y="42" width="64" height="15" rx="3" fill="rgba(255, 46, 99, 0.2)" stroke="#ff2e63" stroke-width="2" filter="url(#neon-glow)" />
     <line x1="68" y1="49" x2="132" y2="49" stroke="#ff2e63" stroke-width="1" />
     <path d="M40,90 L65,80 L70,95 L45,105 Z" fill="#ff2e63" />
     <path d="M160,90 L135,80 L130,95 L155,105 Z" fill="#ff2e63" />`,
    `<path d="M72,25 C72,25 100,12 128,25 L125,35 L75,35 Z" fill="#ff2e63" />
     <path d="M68,30 L74,38 L78,30 Z" fill="#ff2e63" />
     <circle cx="85" cy="50" r="10" fill="none" stroke="#ff2e63" stroke-width="2.5" />
     <circle cx="115" cy="50" r="10" fill="none" stroke="#ff2e63" stroke-width="2.5" />
     <line x1="95" y1="50" x2="105" y2="50" stroke="#ff2e63" stroke-width="2" />`,
    `<path d="M70,20 C70,2 130,2 130,20 L135,40 L65,40 Z" fill="#111" stroke="#ff2e63" stroke-width="2" />
     <path d="M85,2 C100,-8 115,2 115,2 Z" fill="#ff2e63" filter="url(#neon-glow)" />
     <path d="M75,75 L125,75 L115,95 L85,95 Z" fill="#222" stroke="#ff2e63" stroke-width="1" />
     <circle cx="100" cy="85" r="3" fill="#ff2e63" />`
  ],
  effects: [
    `<ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="#08f7fe" stroke-width="2" />
     <line x1="5" y1="12" x2="19" y2="12" stroke="#08f7fe" stroke-width="1" />`,
    `<ellipse cx="100" cy="12" rx="20" ry="5" fill="none" stroke="#08f7fe" stroke-width="2" filter="url(#neon-glow)" />
     <ellipse cx="100" cy="6" rx="14" ry="4.5" fill="none" stroke="#08f7fe" stroke-width="1.5" filter="url(#neon-glow)" />
     <rect x="80" y="80" width="40" height="8" rx="4" fill="#111" stroke="#08f7fe" stroke-width="2" />`,
    `<polygon points="72,40 128,40 122,58 78,58" fill="#1b1a23" stroke="#08f7fe" stroke-width="2.5" filter="url(#neon-glow)" />
     <circle cx="86" cy="49" r="6" fill="#08f7fe" />
     <circle cx="114" cy="49" r="6" fill="#08f7fe" />
     <line x1="86" y1="49" x2="114" y2="49" stroke="#111" stroke-width="2" />`,
    `<circle cx="100" cy="48" r="42" fill="rgba(8, 247, 254, 0.1)" stroke="#08f7fe" stroke-width="2" filter="url(#neon-glow)" />
     <path d="M64,30 C64,30 100,18 136,30" fill="none" stroke="#08f7fe" stroke-width="1.5" />`,
    `<path d="M78,60 L122,60 L115,90 L85,90 Z" fill="#222" stroke="#08f7fe" stroke-width="2" />
     <path d="M96,75 L104,75 M100,71 L100,79" fill="none" stroke="#08f7fe" stroke-width="2" filter="url(#neon-glow)" />`
  ],
  melodies: [
    `<polygon points="72,25 80,5 90,18 100,2 110,18 120,5 128,25" fill="#09f7a0" filter="url(#neon-glow)" />
     <rect x="72" y="23" width="56" height="5" fill="#111" stroke="#09f7a0" stroke-width="1" />`,
    `<path d="M72,28 C72,8 128,8 128,28 Z" fill="#222" />
     <ellipse cx="100" cy="28" rx="38" ry="6" fill="#222" stroke="#09f7a0" stroke-width="1.5" />
     <polygon points="88,96 100,102 88,108" fill="#09f7a0" />
     <polygon points="112,96 100,102 112,108" fill="#09f7a0" />
     <circle cx="100" cy="102" r="3" fill="#fff" />`,
    `<path d="M85,25 Q70,0 55,10" fill="none" stroke="#09f7a0" stroke-width="2.5" filter="url(#neon-glow)" />
     <path d="M115,25 Q130,0 145,10" fill="none" stroke="#09f7a0" stroke-width="2.5" filter="url(#neon-glow)" />
     <circle cx="55" cy="10" r="5" fill="#09f7a0" filter="url(#neon-glow)" />
     <circle cx="145" cy="10" r="5" fill="#09f7a0" filter="url(#neon-glow)" />`,
    `<path d="M100,-8 C92,-8 90,30 90,30 C90,30 110,30 110,30 C110,30 108,-8 100,-8 Z" fill="#09f7a0" filter="url(#neon-glow)" />
     <path d="M100,-8 C95,-8 95,15 90,15 L110,15 Z" fill="#fff" />
     <polygon points="62,60 65,65 71,65 67,69 69,75 64,71 59,75 61,69 57,65 63,65" fill="#09f7a0" />`,
    `<circle cx="84" cy="50" r="11" fill="rgba(9, 247, 240, 0.1)" stroke="#09f7a0" stroke-width="3" filter="url(#neon-glow)" />
     <circle cx="116" cy="50" r="11" fill="rgba(9, 247, 240, 0.1)" stroke="#09f7a0" stroke-width="3" filter="url(#neon-glow)" />
     <line x1="95" y1="46" x2="105" y2="46" stroke="#09f7a0" stroke-width="2" />
     <path d="M66,40 C65,18 135,18 134,40" fill="none" stroke="#09f7a0" stroke-width="2" />`
  ],
  vocals: [
    `<path d="M64,44 C72,36 128,36 136,44 C140,56 125,62 100,56 C75,62 60,56 64,44 Z" fill="#222" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />
     <circle cx="84" cy="47" r="5" fill="#f408fe" />
     <circle cx="116" cy="47" r="5" fill="#f408fe" />`,
    `<path d="M80,62 L120,62 L115,86 C115,86 100,94 85,86 Z" fill="#1b1a23" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />
     <circle cx="100" cy="74" r="7" fill="none" stroke="#f408fe" stroke-width="1.5" />
     <line x1="90" y1="74" x2="110" y2="74" stroke="#f408fe" stroke-width="1" />`,
    `<path d="M60,35 C50,45 42,75 52,90" fill="none" stroke="#f408fe" stroke-width="4.5" filter="url(#neon-glow)" />
     <path d="M140,35 C150,45 158,75 148,90" fill="none" stroke="#f408fe" stroke-width="4.5" filter="url(#neon-glow)" />
     <path d="M100,55 L115,80 L100,95 L85,80 Z" fill="#111" stroke="#f408fe" stroke-width="2" />
     <circle cx="100" cy="80" r="10" fill="none" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />`,
    `<line x1="100" y1="110" x2="100" y2="72" stroke="#f408fe" stroke-width="3" filter="url(#neon-glow)" />
     <circle cx="100" cy="62" r="10" fill="#222" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />
     <line x1="95" y1="62" x2="105" y2="62" stroke="#f408fe" stroke-width="1" />
     <line x1="100" y1="52" x2="100" y2="72" stroke="#f408fe" stroke-width="1" />`,
    `<polygon points="68,44 132,44 126,54 74,54" fill="none" stroke="#f408fe" stroke-width="3" filter="url(#neon-glow)" />
     <path d="M78,64 L84,74 L76,80" fill="none" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />
     <path d="M122,64 L116,74 L124,80" fill="none" stroke="#f408fe" stroke-width="2" filter="url(#neon-glow)" />`
  ]
};

export function getCategoryColor(category: string | null): string {
  if (category === 'beats') return '#ff2e63';
  if (category === 'effects') return '#08f7fe';
  if (category === 'melodies') return '#09f7a0';
  if (category === 'vocals') return '#f408fe';
  return '#555';
}

export function getAvatarSVG(
  state: 'empty' | 'cueing' | 'playing',
  category: string | null,
  index: number,
  amplitude: number,
  currentStep: number
): string {
  const isPlaying = state === 'playing';
  const isCueing = state === 'cueing';
  
  // Bobbing animation values
  let scaleVal = 1.0;
  let headBob = 'translate(0, 0)';
  let bodySway = 'rotate(0 100 100)';
  
  if (isPlaying) {
    scaleVal += amplitude * 0.05;
    const bobDist = (currentStep % 4 < 2) ? 4 : 0;
    headBob = `translate(0, ${bobDist}px)`;
    const swayAngle = Math.sin((currentStep / 64) * Math.PI * 2) * 1.5;
    bodySway = `rotate(${swayAngle} 100 100)`;
  }

  // Base structures
  const bodyPath = `M45,148 C55,115 145,115 155,148 L142,200 L58,200 Z`;
  const neckPath = `M92,90 L92,125 M108,90 L108,125`;
  const headOutline = `<path d="M72,60 C72,32 128,32 128,60 C128,88 128,95 100,95 C72,95 72,88 72,60 Z" fill="url(#skin-grad)" stroke="#111" stroke-width="2" />`;
  const ears = `
    <ellipse cx="68" cy="62" rx="6" ry="10" fill="#2d2b38" stroke="#111" stroke-width="1.5" />
    <ellipse cx="132" cy="62" rx="6" ry="10" fill="#2d2b38" stroke="#111" stroke-width="1.5" />
  `;

  // Mouth shapes
  let mouth = `<line x1="90" y1="78" x2="110" y2="78" stroke="#111" stroke-width="2" stroke-linecap="round" />`;
  if (isPlaying) {
    if (category === 'vocals' || category === 'melodies') {
      const mouthSize = Math.max(2, Math.floor(amplitude * 14));
      if (mouthSize > 3) {
        if (currentStep % 8 < 4) {
          mouth = `<circle cx="100" cy="78" r="${mouthSize}" fill="#222" stroke="#111" stroke-width="2" />`;
        } else {
          mouth = `<ellipse cx="100" cy="78" rx="${mouthSize + 3}" ry="${mouthSize - 1}" fill="#111" />`;
        }
      }
    } else {
      const smileOffset = (currentStep % 2 === 0) ? 1.5 : 0;
      mouth = `<path d="M92,76 C95,${79 + smileOffset} 105,${79 + smileOffset} 108,76" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" />`;
    }
  }

  // Eyes shapes
  let eyes = `
    <line x1="84" y1="52" x2="92" y2="52" stroke="#111" stroke-width="2" stroke-linecap="round" />
    <line x1="108" y1="52" x2="116" y2="52" stroke="#111" stroke-width="2" stroke-linecap="round" />
  `;
  if (isPlaying) {
    if (currentStep % 2 === 0) {
      eyes = `
        <circle cx="88" cy="51" r="3" fill="#111" />
        <circle cx="112" cy="51" r="3" fill="#111" />
      `;
    } else {
      eyes = `
        <path d="M83,53 Q88,48 93,53" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" />
        <path d="M107,53 Q112,48 117,53" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" />
      `;
    }
  }

  const accessoryMarkup = (category && ACCESSORIES[category] && ACCESSORIES[category][index])
    ? ACCESSORIES[category][index]
    : '';

  let statusOverlay = '';
  if (isCueing && category) {
    statusOverlay = `
      <circle cx="100" cy="100" r="80" fill="none" stroke="${getCategoryColor(category)}" stroke-width="3" stroke-dasharray="10,6" filter="url(#neon-glow)" class="rotating-cue-ring" />
      <g transform="translate(100, 100)">
           <circle cx="0" cy="0" r="18" fill="rgba(0,0,0,0.5)" />
           <path d="M-6,0 A6,6 0 0,1 6,0" fill="none" stroke="${getCategoryColor(category)}" stroke-width="2.5" class="spinner-arc" />
      </g>
    `;
  }

  return `
    <svg viewBox="0 0 200 200" width="100%" height="100%" class="avatar-svg ${state}-avatar" style="transform: scale(${scaleVal}); transition: transform 0.05s linear;">
        ${SVG_DEFS}
        ${isPlaying && category ? `<circle cx="100" cy="65" r="${35 + amplitude * 22}" fill="none" stroke="${getCategoryColor(category)}" stroke-width="${1.5 + amplitude * 4}" opacity="${0.6 - amplitude * 0.4}" filter="url(#neon-glow)" />` : ''}
        <g style="transform: ${bodySway}; transition: transform 0.08s ease;">
            <path d="${bodyPath}" fill="url(#skin-grad)" stroke="#111" stroke-width="2" />
            <path d="${neckPath}" fill="none" stroke="#2d2b38" stroke-width="1.5" />
            <g style="transform: ${headBob}; transform-origin: 100px 90px; transition: transform 0.06s ease;">
                ${ears}
                ${headOutline}
                ${eyes}
                ${mouth}
                ${accessoryMarkup}
            </g>
        </g>
        ${statusOverlay}
    </svg>
  `;
}
