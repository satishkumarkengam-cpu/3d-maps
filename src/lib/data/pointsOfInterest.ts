import type { Poi } from '../types';

// Curated landmarks and infrastructure across Metro Vancouver. Coordinates are
// approximate [longitude, latitude] pairs suitable for map placement.
export const POINTS_OF_INTEREST: Poi[] = [
  // Airports
  { id: 'yvr', name: 'Vancouver International Airport (YVR)', category: 'airport', position: [-123.184, 49.1967], description: "Canada's second-busiest airport." },
  { id: 'boundary-bay', name: 'Boundary Bay Airport (CZBB)', category: 'airport', position: [-123.0122, 49.0742], description: 'General aviation & flight training.' },
  { id: 'pitt-meadows-airport', name: 'Pitt Meadows Airport (CYPK)', category: 'airport', position: [-122.7108, 49.2161], description: 'Regional/general aviation airport.' },
  { id: 'abbotsford-airport', name: 'Abbotsford International Airport (YXX)', category: 'airport', position: [-122.3606, 49.0253], description: 'Home of the Abbotsford Airshow.' },

  // Ports
  { id: 'port-vancouver', name: 'Port of Vancouver (Centerm)', category: 'port', position: [-123.083, 49.2887], description: "Canada's largest port." },
  { id: 'deltaport', name: 'Deltaport (Roberts Bank)', category: 'port', position: [-123.155, 49.0], description: 'Major container & coal terminal.' },
  { id: 'fraser-surrey-docks', name: 'Fraser Surrey Docks', category: 'port', position: [-122.842, 49.196], description: 'Break-bulk & container terminal on the Fraser.' },

  // Landmarks
  { id: 'stanley-park', name: 'Stanley Park', category: 'park', position: [-123.1443, 49.3017], description: '405-hectare urban rainforest park.' },
  { id: 'science-world', name: 'Science World', category: 'landmark', position: [-123.1039, 49.2734], description: 'Geodesic dome on False Creek.' },
  { id: 'canada-place', name: 'Canada Place', category: 'landmark', position: [-123.1115, 49.2888], description: 'Sail-roofed convention centre & cruise terminal.' },
  { id: 'gastown-clock', name: 'Gastown Steam Clock', category: 'landmark', position: [-123.1089, 49.2844], description: 'Iconic steam-powered clock.' },
  { id: 'grouse-mountain', name: 'Grouse Mountain', category: 'landmark', position: [-123.0817, 49.3803], description: 'North Shore mountain & ski resort.' },
  { id: 'capilano-bridge', name: 'Capilano Suspension Bridge', category: 'landmark', position: [-123.1147, 49.3427], description: 'Historic suspension bridge over a canyon.' },
  { id: 'queen-elizabeth-park', name: 'Queen Elizabeth Park', category: 'park', position: [-123.1126, 49.2417], description: 'Highest point in the City of Vancouver.' },

  // Stadiums
  { id: 'bc-place', name: 'BC Place', category: 'stadium', position: [-123.1119, 49.2768], description: 'Retractable-roof stadium; home of the Whitecaps & Lions.' },
  { id: 'rogers-arena', name: 'Rogers Arena', category: 'stadium', position: [-123.1088, 49.2778], description: 'Home of the Vancouver Canucks.' },

  // Hospitals
  { id: 'vgh', name: 'Vancouver General Hospital', category: 'hospital', position: [-123.1236, 49.2622], description: 'One of the largest hospitals in Canada.' },
  { id: 'st-pauls', name: "St. Paul's Hospital", category: 'hospital', position: [-123.1287, 49.2806], description: 'Downtown Vancouver acute-care hospital.' },
  { id: 'royal-columbian', name: 'Royal Columbian Hospital', category: 'hospital', position: [-122.8894, 49.2264], description: 'Trauma & cardiac centre in New Westminster.' },
  { id: 'surrey-memorial', name: 'Surrey Memorial Hospital', category: 'hospital', position: [-122.844, 49.1766], description: 'Second-largest hospital in BC.' },
  { id: 'lions-gate-hospital', name: 'Lions Gate Hospital', category: 'hospital', position: [-123.0716, 49.3225], description: 'North Shore acute-care hospital.' },
  { id: 'richmond-hospital', name: 'Richmond Hospital', category: 'hospital', position: [-123.1477, 49.1706], description: 'Community hospital serving Richmond.' },
  { id: 'ridge-meadows-hospital', name: 'Ridge Meadows Hospital', category: 'hospital', position: [-122.6, 49.2213], description: 'Serving Maple Ridge & Pitt Meadows.' },
  { id: 'abbotsford-hospital', name: 'Abbotsford Regional Hospital', category: 'hospital', position: [-122.3255, 49.0333], description: 'Fraser Valley regional hospital & cancer centre.' },

  // Universities
  { id: 'ubc', name: 'University of British Columbia (UBC)', category: 'university', position: [-123.246, 49.2606], description: 'Point Grey campus.' },
  { id: 'sfu', name: 'Simon Fraser University (SFU)', category: 'university', position: [-122.9199, 49.2781], description: 'Burnaby Mountain campus.' },
  { id: 'kpu', name: 'Kwantlen Polytechnic University', category: 'university', position: [-122.8492, 49.1329], description: 'Surrey campus.' },
  { id: 'ufv', name: 'University of the Fraser Valley', category: 'university', position: [-122.2864, 49.0286], description: 'Abbotsford campus.' },
  { id: 'bcit', name: 'BC Institute of Technology (BCIT)', category: 'university', position: [-123.0018, 49.2503], description: 'Burnaby polytechnic campus.' },

  // Bridges
  { id: 'lions-gate-bridge', name: 'Lions Gate Bridge', category: 'bridge', position: [-123.1387, 49.3147], description: 'Suspension bridge to the North Shore (1938).' },
  { id: 'ironworkers', name: 'Ironworkers Memorial Bridge', category: 'bridge', position: [-123.0261, 49.294], description: 'Second Narrows crossing of Burrard Inlet.' },
  { id: 'port-mann', name: 'Port Mann Bridge', category: 'bridge', position: [-122.8083, 49.2036], description: 'Ten-lane cable-stayed Fraser River crossing.' },
  { id: 'alex-fraser', name: 'Alex Fraser Bridge', category: 'bridge', position: [-122.9483, 49.1636], description: 'Cable-stayed bridge linking Delta & New West.' },
  { id: 'golden-ears', name: 'Golden Ears Bridge', category: 'bridge', position: [-122.6431, 49.1972], description: 'Links Langley with Maple Ridge/Pitt Meadows.' },
  { id: 'pattullo', name: 'Pattullo Bridge', category: 'bridge', position: [-122.8967, 49.2036], description: 'Fraser River crossing (New West ↔ Surrey).' },
];
