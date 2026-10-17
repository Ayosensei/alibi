// scripts/generate-avatars.mjs
import fs from 'node:fs';
import path from 'node:path';

const CHARACTERS = [
  // Level 1
  {
    id: 'walter',
    name: 'Walter Ames',
    role: 'Owner & Caretaker',
    victim: true,
    bg1: '#381c20',
    bg2: '#180d0f',
    accent: '#a33327',
    hair: '#8a8580',
    skin: '#d4b59d',
    clothes: '#3a3335',
    detail: 'vest',
    accessory: 'mustache',
  },
  {
    id: 'dee',
    name: 'Dee Marsh',
    role: 'Stage Manager',
    bg1: '#182736',
    bg2: '#0d151e',
    accent: '#d4af37',
    hair: '#1e1c1b',
    skin: '#a67b56',
    clothes: '#212a35',
    detail: 'headset',
    hairStyle: 'bob',
  },
  {
    id: 'kofi',
    name: 'Kofi Mensah',
    role: 'Lighting Tech',
    bg1: '#2d2217',
    bg2: '#161009',
    accent: '#d4af37',
    hair: '#141211',
    skin: '#754b2e',
    clothes: '#2b2c34',
    detail: 'cap',
    hairStyle: 'curly',
  },
  {
    id: 'hana',
    name: 'Hana Petrov',
    role: 'Set Builder',
    bg1: '#1b2a22',
    bg2: '#0e1712',
    accent: '#d4af37',
    hair: '#63422d',
    skin: '#e5cbb3',
    clothes: '#353a2f',
    detail: 'pencil',
    hairStyle: 'ponytail',
  },
  {
    id: 'okoye',
    name: 'Mr. Okoye',
    role: 'Box-office Manager',
    bg1: '#1f2430',
    bg2: '#0f121a',
    accent: '#d4af37',
    hair: '#1a1818',
    skin: '#6c4327',
    clothes: '#1d222b',
    detail: 'glasses_bowtie',
    hairStyle: 'parted',
  },

  // Level 2
  {
    id: 'alistair',
    name: 'Alistair Penhallow',
    role: 'Collector',
    victim: true,
    bg1: '#36221c',
    bg2: '#1a100d',
    accent: '#a33327',
    hair: '#b0a89e',
    skin: '#d9bfab',
    clothes: '#302622',
    detail: 'beard_victorian',
  },
  {
    id: 'beatrix',
    name: 'Beatrix Lorne',
    role: 'Cataloguer',
    bg1: '#261c2b',
    bg2: '#130d17',
    accent: '#d4af37',
    hair: '#2c221e',
    skin: '#e0c7b4',
    clothes: '#2b2130',
    detail: 'cat_glasses',
    hairStyle: 'bun',
  },
  {
    id: 'dorian',
    name: 'Dorian Quill',
    role: 'Rival Dealer',
    bg1: '#2b2420',
    bg2: '#15110f',
    accent: '#d4af37',
    hair: '#382a20',
    skin: '#d6b79f',
    clothes: '#302621',
    detail: 'fedora_cigar',
  },
  {
    id: 'rufus',
    name: 'Rufus Tull',
    role: 'Porter',
    bg1: '#2c1e1c',
    bg2: '#160e0d',
    accent: '#d4af37',
    hair: '#4a3d37',
    skin: '#caa38a',
    clothes: '#3b2f2d',
    detail: 'beanie_stubble',
  },
  {
    id: 'imogen',
    name: 'Imogen Sato',
    role: 'Auctioneer',
    bg1: '#26221d',
    bg2: '#14120e',
    accent: '#d4af37',
    hair: '#1a181a',
    skin: '#e2ccba',
    clothes: '#29252a',
    detail: 'pearl_necklace',
    hairStyle: 'wavy',
  },

  // Level 3
  {
    id: 'edmund',
    name: 'Edmund Vale',
    role: 'Shipping Founder',
    victim: true,
    bg1: '#381920',
    bg2: '#190a0e',
    accent: '#a33327',
    hair: '#c4bcc0',
    skin: '#dbbaa5',
    clothes: '#2b1e22',
    detail: 'tuxedo_crest',
  },
  {
    id: 'clara',
    name: 'Clara Vale',
    role: 'Finance Director',
    bg1: '#182234',
    bg2: '#0b111c',
    accent: '#d4af37',
    hair: '#1d191b',
    skin: '#d9b79e',
    clothes: '#1b263b',
    detail: 'earrings_suit',
    hairStyle: 'sharp_bob',
  },
  {
    id: 'tobias',
    name: 'Tobias Finch',
    role: 'Bookkeeper',
    bg1: '#24252a',
    bg2: '#121316',
    accent: '#d4af37',
    hair: '#403831',
    skin: '#dfc6b1',
    clothes: '#282b30',
    detail: 'round_glasses_pen',
  },
  {
    id: 'roz',
    name: 'Roz Vale',
    role: 'Edmund’s Wife',
    bg1: '#2e1925',
    bg2: '#160a12',
    accent: '#d4af37',
    hair: '#54261d',
    skin: '#e0c0ab',
    clothes: '#361e2c',
    detail: 'evening_waves',
    hairStyle: 'finger_waves',
  },
  {
    id: 'imani',
    name: 'Dr. Imani Okafor',
    role: 'Family Physician',
    bg1: '#162728',
    bg2: '#0b1516',
    accent: '#d4af37',
    hair: '#141212',
    skin: '#6c4327',
    clothes: '#1c2e30',
    detail: 'stethoscope',
    hairStyle: 'updo',
  },
  {
    id: 'gideon',
    name: 'Gideon Marsh',
    role: 'Business Partner',
    bg1: '#2b2118',
    bg2: '#15100a',
    accent: '#d4af37',
    hair: '#524339',
    skin: '#d4b39b',
    clothes: '#33271d',
    detail: 'heavy_coat',
  },
  {
    id: 'felix',
    name: 'Felix Vale',
    role: 'Pianist',
    bg1: '#1f1b2d',
    bg2: '#0f0d18',
    accent: '#d4af37',
    hair: '#2e252a',
    skin: '#d6b8a2',
    clothes: '#262238',
    detail: 'artistic_collar',
    hairStyle: 'tousled',
  },
];

function generateSvg(char) {
  const isVictim = char.victim;
  const rimColor = isVictim ? '#a33327' : '#d4af37';
  const rimWidth = isVictim ? 3 : 2;

  let extraHeadwear = '';
  let extraAccessories = '';

  if (char.detail === 'fedora_cigar') {
    extraHeadwear = `
      <!-- Fedora -->
      <path d="M 28 50 Q 64 36 100 50 L 94 44 Q 64 28 34 44 Z" fill="#201a18" />
      <path d="M 36 46 Q 64 24 92 46 Q 84 34 64 32 Q 44 34 36 46 Z" fill="#151210" />
      <path d="M 40 45 Q 64 38 88 45" stroke="#d4af37" stroke-width="2" fill="none" opacity="0.8" />
      <!-- Cigar -->
      <rect x="76" y="78" width="16" height="4" rx="2" fill="#8c6248" transform="rotate(15 76 78)" />
      <circle cx="92" cy="82" r="2" fill="#e8613c" />
      <path d="M 94 81 Q 98 76 96 70 Q 100 66 98 60" stroke="#aaa" stroke-width="1.2" fill="none" stroke-dasharray="2,2" opacity="0.6" />
    `;
  } else if (char.detail === 'beanie_stubble') {
    extraHeadwear = `
      <!-- Beanie -->
      <path d="M 34 50 Q 64 26 94 50 Q 64 42 34 50 Z" fill="#202224" />
      <rect x="33" y="47" width="62" height="7" rx="3" fill="#2c3035" />
    `;
    extraAccessories = `
      <!-- Stubble -->
      <path d="M 50 82 Q 64 92 78 82 Q 78 87 64 91 Q 50 87 50 82 Z" fill="#302621" opacity="0.4" />
    `;
  } else if (char.detail === 'cap') {
    extraHeadwear = `
      <!-- Cap turned back -->
      <path d="M 36 48 Q 64 32 92 48 L 98 52 Q 64 42 30 52 Z" fill="#1e2024" />
      <path d="M 28 51 Q 18 56 12 55 Q 22 51 32 50 Z" fill="#141517" />
    `;
  } else if (char.detail === 'cat_glasses' || char.detail === 'glasses_bowtie' || char.detail === 'round_glasses_pen') {
    if (char.detail === 'cat_glasses') {
      extraAccessories += `
        <!-- Cat-eye glasses -->
        <circle cx="52" cy="65" r="9" stroke="#d4af37" stroke-width="1.5" fill="none" />
        <circle cx="76" cy="65" r="9" stroke="#d4af37" stroke-width="1.5" fill="none" />
        <path d="M 61 64 Q 64 63 67 64" stroke="#d4af37" stroke-width="1.5" fill="none" />
        <path d="M 43 60 L 40 56 M 85 60 L 88 56" stroke="#d4af37" stroke-width="1.5" />
      `;
    } else if (char.detail === 'round_glasses_pen') {
      extraAccessories += `
        <!-- Round glasses -->
        <circle cx="52" cy="66" r="8" stroke="#a09890" stroke-width="1.5" fill="none" />
        <circle cx="76" cy="66" r="8" stroke="#a09890" stroke-width="1.5" fill="none" />
        <line x1="60" y1="66" x2="68" y2="66" stroke="#a09890" stroke-width="1.5" />
      `;
    } else {
      extraAccessories += `
        <!-- Wireframe glasses & Bowtie -->
        <rect x="44" y="60" width="16" height="12" rx="3" stroke="#d4af37" stroke-width="1.5" fill="none" />
        <rect x="68" y="60" width="16" height="12" rx="3" stroke="#d4af37" stroke-width="1.5" fill="none" />
        <line x1="60" y1="65" x2="68" y2="65" stroke="#d4af37" stroke-width="1.5" />
        <!-- Bowtie -->
        <polygon points="56,102 64,105 56,108" fill="#1c1f26" />
        <polygon points="72,102 64,105 72,108" fill="#1c1f26" />
        <circle cx="64" cy="105" r="2.5" fill="#d4af37" />
      `;
    }
  }

  if (char.detail === 'headset') {
    extraAccessories += `
      <!-- Stage Manager Headset -->
      <path d="M 38 65 Q 36 40 64 38 Q 92 40 90 65" stroke="#4a5568" stroke-width="2.5" fill="none" />
      <rect x="34" y="62" width="6" height="12" rx="2" fill="#2d3748" />
      <path d="M 37 72 Q 46 84 56 82" stroke="#4a5568" stroke-width="1.5" fill="none" />
      <circle cx="57" cy="82" r="2" fill="#d4af37" />
    `;
  } else if (char.detail === 'stethoscope') {
    extraAccessories += `
      <!-- Stethoscope -->
      <path d="M 46 95 Q 48 114 64 114 Q 80 114 82 95" stroke="#a0aec0" stroke-width="2" fill="none" />
      <path d="M 64 114 L 64 122" stroke="#a0aec0" stroke-width="2" />
      <circle cx="64" cy="124" r="3.5" fill="#d4af37" stroke="#a0aec0" stroke-width="1" />
    `;
  } else if (char.detail === 'pearl_necklace') {
    extraAccessories += `
      <!-- Pearl necklace -->
      <circle cx="54" cy="98" r="2" fill="#eae6df" />
      <circle cx="59" cy="100" r="2" fill="#eae6df" />
      <circle cx="64" cy="101" r="2.2" fill="#eae6df" />
      <circle cx="69" cy="100" r="2" fill="#eae6df" />
      <circle cx="74" cy="98" r="2" fill="#eae6df" />
    `;
  }

  // Hair styling variations
  let hairPath = `
    <!-- Default Hair -->
    <path d="M 38 62 Q 34 38 64 36 Q 94 38 90 62 Q 82 46 64 46 Q 46 46 38 62 Z" fill="${char.hair}" />
  `;

  if (char.hairStyle === 'bob') {
    hairPath = `
      <path d="M 36 68 Q 32 38 64 35 Q 96 38 92 68 Q 90 50 64 46 Q 38 50 36 68 Z" fill="${char.hair}" />
      <path d="M 34 60 Q 32 75 42 76 Q 40 64 42 56 Z" fill="${char.hair}" />
      <path d="M 94 60 Q 96 75 86 76 Q 88 64 86 56 Z" fill="${char.hair}" />
    `;
  } else if (char.hairStyle === 'bun') {
    hairPath = `
      <circle cx="64" cy="30" r="11" fill="${char.hair}" />
      <path d="M 38 60 Q 34 38 64 36 Q 94 38 90 60 Q 82 46 64 45 Q 46 46 38 60 Z" fill="${char.hair}" />
    `;
  } else if (char.hairStyle === 'curly') {
    hairPath = `
      <circle cx="44" cy="46" r="8" fill="${char.hair}" />
      <circle cx="56" cy="40" r="8" fill="${char.hair}" />
      <circle cx="68" cy="40" r="8" fill="${char.hair}" />
      <circle cx="80" cy="46" r="8" fill="${char.hair}" />
      <circle cx="84" cy="56" r="7" fill="${char.hair}" />
      <circle cx="40" cy="56" r="7" fill="${char.hair}" />
    `;
  } else if (char.hairStyle === 'ponytail') {
    hairPath = `
      <path d="M 38 60 Q 34 38 64 36 Q 94 38 90 60 Q 82 46 64 45 Q 46 46 38 60 Z" fill="${char.hair}" />
      <!-- Ponytail -->
      <path d="M 88 52 Q 102 60 98 75 Q 92 70 88 60 Z" fill="${char.hair}" />
      <circle cx="88" cy="54" r="3" fill="#d4af37" />
    `;
  } else if (char.hairStyle === 'finger_waves') {
    hairPath = `
      <path d="M 36 65 Q 32 36 64 34 Q 96 36 92 65 Q 86 42 64 42 Q 42 42 36 65 Z" fill="${char.hair}" />
      <path d="M 34 52 Q 38 56 34 62 Q 38 66 36 72" stroke="${char.accent}" stroke-width="1.5" fill="none" opacity="0.6" />
      <path d="M 94 52 Q 90 56 94 62 Q 90 66 92 72" stroke="${char.accent}" stroke-width="1.5" fill="none" opacity="0.6" />
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="bg_${char.id}" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${char.bg1}" />
      <stop offset="100%" stop-color="${char.bg2}" />
    </radialGradient>
    <linearGradient id="rim_${char.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rimColor}" />
      <stop offset="100%" stop-color="${isVictim ? '#54151a' : '#8c6d1d'}" />
    </linearGradient>
    <clipPath id="circleClip_${char.id}">
      <circle cx="64" cy="64" r="60" />
    </clipPath>
  </defs>

  <!-- Background Circle with Noir Gradient -->
  <circle cx="64" cy="64" r="62" fill="url(#bg_${char.id})" />

  <!-- Clipped Portrait Illustration -->
  <g clip-path="url(#circleClip_${char.id})">
    <!-- Victim Background Watermark -->
    ${
      isVictim
        ? `<circle cx="64" cy="64" r="50" stroke="#a33327" stroke-width="1" stroke-dasharray="3,3" fill="none" opacity="0.3" />
           <path d="M 44 44 L 84 84 M 84 44 L 44 84" stroke="#a33327" stroke-width="1.5" opacity="0.2" />`
        : ''
    }

    <!-- Shoulders & Coat -->
    <path d="M 22 128 Q 22 100 48 94 L 80 94 Q 106 100 106 128 Z" fill="${char.clothes}" />
    <!-- Collar / Shirt -->
    <polygon points="54,94 64,106 74,94" fill="#ede8df" />
    <polygon points="56,94 64,116 72,94" fill="#202228" opacity="0.4" />

    <!-- Neck -->
    <rect x="56" y="78" width="16" height="18" fill="${char.skin}" />
    <path d="M 56 86 Q 64 92 72 86 Z" fill="#000" opacity="0.15" />

    <!-- Head / Face -->
    <ellipse cx="64" cy="66" rx="20" ry="24" fill="${char.skin}" />

    <!-- Ears -->
    <circle cx="43" cy="66" r="4" fill="${char.skin}" />
    <circle cx="85" cy="66" r="4" fill="${char.skin}" />

    <!-- Hair -->
    ${hairPath}
    ${extraHeadwear}

    <!-- Eyes (Subtle Noir Stylized) -->
    <ellipse cx="54" cy="66" rx="2.5" ry="1.8" fill="#1a1818" />
    <ellipse cx="74" cy="66" rx="2.5" ry="1.8" fill="#1a1818" />
    <!-- Eyebrows -->
    <path d="M 49 61 Q 54 59 59 61" stroke="#2a2420" stroke-width="1.5" fill="none" />
    <path d="M 69 61 Q 74 59 79 61" stroke="#2a2420" stroke-width="1.5" fill="none" />

    <!-- Nose -->
    <path d="M 64 64 L 62 72 L 66 72" stroke="#000" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.35" />

    <!-- Mouth -->
    <path d="M 58 78 Q 64 81 70 78" stroke="#7a423b" stroke-width="1.8" fill="none" stroke-linecap="round" />

    <!-- Extra Accessories & Details -->
    ${extraAccessories}
  </g>

  <!-- Outer Ring (Brass for suspects, Crimson for victims) -->
  <circle cx="64" cy="64" r="61" fill="none" stroke="url(#rim_${char.id})" stroke-width="${rimWidth}" />
</svg>`;
}

const outDir = path.resolve('public/avatars');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const char of CHARACTERS) {
  const filePath = path.join(outDir, `${char.id}.svg`);
  fs.writeFileSync(filePath, generateSvg(char), 'utf8');
  console.log(`Generated avatar for ${char.name} (${char.id}) -> ${filePath}`);
}

console.log(`Successfully generated ${CHARACTERS.length} avatars.`);
