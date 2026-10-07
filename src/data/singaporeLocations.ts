import { ParkLocation, MallLocation } from '../types';

export const SINGAPORE_PARKS: ParkLocation[] = [
  // Central Region
  {
    id: 'central-bishan-amk',
    name: 'Bishan-Ang Mo Kio Park',
    region: 'central',
    latitude: 1.3626,
    longitude: 103.8467,
    description: 'Expansive river park with wide paved jogging paths alongside naturalised Kallang River.',
    trackLengthKm: 6.2,
    surface: 'Paved Asphalt & Gravel Tracks',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Water Coolers', 'Restrooms', 'F&B Cafes', 'Fitness Corners', 'Distance Markers'],
    suitableFor: ['Long Distance Jogging', 'Intervals', 'Evening Runs']
  },
  {
    id: 'central-botanic-gardens',
    name: 'Singapore Botanic Gardens',
    region: 'central',
    latitude: 1.3138,
    longitude: 103.8159,
    description: 'UNESCO World Heritage site with gentle rolling hills, lake loops, and shaded rain trees.',
    trackLengthKm: 5.0,
    surface: 'Smooth Paved Footpaths',
    lighting: 'Lit until 12:00 AM',
    amenities: ['Lockers', 'Showers', 'Restrooms', 'Visitor Center', 'Water Dispensers'],
    suitableFor: ['Scenic Jogging', 'Hill Repeats', 'Morning Sunrise Run']
  },
  {
    id: 'central-macritchie',
    name: 'MacRitchie Reservoir Park',
    region: 'central',
    latitude: 1.3438,
    longitude: 103.8340,
    description: 'Singapore oldest reservoir offering lush boardwalks and dirt trails surrounded by rainforest.',
    trackLengthKm: 11.0,
    surface: 'Boardwalk, Dirt Trail & Gravel',
    lighting: 'Lit around park entrance only until 7:00 PM',
    amenities: ['Washrooms', 'Lockers', 'Water Fountains', 'Kayak Basin', 'Paddle Lodge'],
    suitableFor: ['Trail Running', 'Endurance Training', 'Cross-Country']
  },
  {
    id: 'central-fort-canning',
    name: 'Fort Canning Park',
    region: 'central',
    latitude: 1.2952,
    longitude: 103.8465,
    description: 'Historic hilltop sanctuary with heritage gardens, stair climbs, and shaded perimeter paths.',
    trackLengthKm: 3.2,
    surface: 'Paved Pathways & Stairs',
    lighting: '24/7 Well-lit paths',
    amenities: ['Drinking Fountains', 'Heritage Signboards', 'MRT Underpass'],
    suitableFor: ['Stair Conditioning', 'Short City Run', 'Hill Training']
  },
  {
    id: 'central-kallang-riverside',
    name: 'Kallang Riverside Park',
    region: 'central',
    latitude: 1.3060,
    longitude: 103.8680,
    description: 'Waterfront running track overlooking the Singapore Sports Hub and Singapore River.',
    trackLengthKm: 4.8,
    surface: 'Flat Paved Tarmac',
    lighting: 'Lit until 11:00 PM',
    amenities: ['Benches', 'Restrooms', 'Connects to Marina Promenade', 'Fitness Stations'],
    suitableFor: ['Flat Tempo Runs', 'Night Jogging', 'Breeze Waterfront Run']
  },

  // East Region
  {
    id: 'east-ecp',
    name: 'East Coast Park (Coastal Track)',
    region: 'east',
    latitude: 1.3008,
    longitude: 103.9122,
    description: 'Singapore premier outdoor beach park with dedicated continuous running and cycling tracks.',
    trackLengthKm: 15.0,
    surface: 'Smooth Red Paved Running Track',
    lighting: '24/7 High-visibility Lighting',
    amenities: ['Shower Facilities', 'Rental Kiosks', 'Water Coolers', 'Coastal Cafes', 'First Aid'],
    suitableFor: ['Half-Marathon Training', 'Seaside Sprints', 'Night Long Runs']
  },
  {
    id: 'east-bedok-reservoir',
    name: 'Bedok Reservoir Park',
    region: 'east',
    latitude: 1.3407,
    longitude: 103.9312,
    description: 'Dedicated 4.3km flat loop around peaceful waters with soft gravel running track on knees.',
    trackLengthKm: 4.3,
    surface: 'Compacted Pebble Track & Paved',
    lighting: 'Lit until 11:00 PM',
    amenities: ['Restrooms', 'Exercise Stations', 'Kayaking Dock', 'Floating Deck'],
    suitableFor: ['Joint-Friendly Jogging', '5K Time Trials', 'Laps Training']
  },
  {
    id: 'east-pasir-ris',
    name: 'Pasir Ris Park & Mangrove',
    region: 'east',
    latitude: 1.3752,
    longitude: 103.9510,
    description: 'Tranquil coastal park featuring wide open parkland, pony club trails, and mangrove boardwalks.',
    trackLengthKm: 6.8,
    surface: 'Paved Asphalt & Timber Boardwalk',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Restrooms', 'Shelters', 'Kitchen Garden', 'Campgrounds'],
    suitableFor: ['Relaxed Jogging', 'Seaside Recovery Run']
  },
  {
    id: 'east-tampines-eco-green',
    name: 'Tampines Eco Green',
    region: 'east',
    latitude: 1.3582,
    longitude: 103.9516,
    description: 'Sanctuary park designed with natural hiking and running carpets made of grass and soil.',
    trackLengthKm: 3.0,
    surface: 'Natural Grass & Earth Tracks',
    lighting: 'No artificial lighting (Daylight only 7am-7pm)',
    amenities: ['Eco-toilet', 'Bird Hides', 'Freshwater Ponds'],
    suitableFor: ['Barefoot / Soft-ground Jogging', 'Nature Walk & Jog']
  },
  {
    id: 'east-changi-beach',
    name: 'Changi Beach Park',
    region: 'east',
    latitude: 1.3912,
    longitude: 103.9936,
    description: 'One of the oldest coastal parks with undisturbed rustic charm looking towards Pulau Ubin.',
    trackLengthKm: 3.3,
    surface: 'Paved Promenade',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Restrooms', 'Bistro', 'Camp Sites', 'Water Points'],
    suitableFor: ['Ocean Breeze Runs', 'Weekend Morning Jog']
  },

  // West Region
  {
    id: 'west-jurong-lake-gardens',
    name: 'Jurong Lake Gardens',
    region: 'west',
    latitude: 1.3364,
    longitude: 103.7297,
    description: 'Sprawling 90-hectare national garden with winding lakeside boardwalks and grassland loops.',
    trackLengthKm: 7.5,
    surface: 'Paved Pathways & Synthetic Turf',
    lighting: 'Lit until 10:30 PM',
    amenities: ['Showers & Lockers', 'ActiveSG Gym', 'Restrooms', 'Cafe', 'Water Stations'],
    suitableFor: ['Long Scenic Runs', 'Sunset Jogs', 'Community Fitness']
  },
  {
    id: 'west-west-coast-park',
    name: 'West Coast Park',
    region: 'west',
    latitude: 1.2989,
    longitude: 103.7667,
    description: 'Known as the Western counterpart to ECP, offers quiet oceanfront running with breezy straits view.',
    trackLengthKm: 5.2,
    surface: 'Paved Concrete & Earth',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Camp Area', 'Restrooms', 'Fast Food & Cafe', 'Fitness Areas'],
    suitableFor: ['Even Tempo Running', 'Family-friendly Jogs']
  },
  {
    id: 'west-bukit-batok-nature-park',
    name: 'Bukit Batok Nature Park',
    region: 'west',
    latitude: 1.3512,
    longitude: 103.7635,
    description: 'Quarry cliff views with moderate undulating inclines for building leg power.',
    trackLengthKm: 3.8,
    surface: 'Asphalt & Forest Steps',
    lighting: 'Lit until 7:00 PM',
    amenities: ['Restrooms', 'Lookout Points', 'World War II Memorial Plaque'],
    suitableFor: ['Elevation Training', 'Interval Training']
  },
  {
    id: 'west-clementi-woods',
    name: 'Clementi Woods Park',
    region: 'west',
    latitude: 1.3031,
    longitude: 103.7712,
    description: 'Quiet wooded neighborhood park with gentle slopes connecting to West Coast highway.',
    trackLengthKm: 2.2,
    surface: 'Paved Footpath',
    lighting: 'Lit until 9:00 PM',
    amenities: ['Restrooms', 'Amphitheatre', 'Benches'],
    suitableFor: ['Short Easy Jogs', 'Cool Down Strides']
  },

  // North Region
  {
    id: 'north-admiralty-park',
    name: 'Admiralty Park',
    region: 'north',
    latitude: 1.4463,
    longitude: 103.7820,
    description: 'Largest park in the North with secondary forest, mangrove boardwalks, and hill loops.',
    trackLengthKm: 4.5,
    surface: 'Paved Concrete & Boardwalk',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Restrooms', 'Water Dispensers', 'Bicycle Racks', 'Sakura Resto'],
    suitableFor: ['Cross-Terrain Jogging', 'Woodlands Community Runs']
  },
  {
    id: 'north-sembawang-park',
    name: 'Sembawang Park',
    region: 'north',
    latitude: 1.4633,
    longitude: 103.8375,
    description: 'Seaside park situated along Straits of Johor with cool maritime breezes and historic Beaulieu House.',
    trackLengthKm: 3.0,
    surface: 'Paved Coastal Promenade',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Restrooms', 'Barbecue Pits', 'Seaside Resto', 'Water Points'],
    suitableFor: ['Coastal Sunrise Runs', 'Relaxed Recovery Jog']
  },
  {
    id: 'north-yishun-park',
    name: 'Yishun Park',
    region: 'north',
    latitude: 1.4239,
    longitude: 103.8436,
    description: 'Old rubber estate transformed into a shaded forest park with fruit tree collections.',
    trackLengthKm: 3.5,
    surface: 'Smooth Paved Footpaths',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Fitness Corner', 'Restrooms', 'Dipterocarp Arboretum'],
    suitableFor: ['Shaded Morning Jogs', 'Circuit Runs']
  },
  {
    id: 'north-lower-seletar',
    name: 'Lower Seletar Reservoir Park',
    region: 'north',
    latitude: 1.4116,
    longitude: 103.8385,
    description: 'Calm water surface with picturesque Family Bay and wooden jetty for early sunrise runs.',
    trackLengthKm: 3.2,
    surface: 'Paved Lakeside Boardwalk',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Water Play Area', 'Fishing Jetty', 'Restrooms', 'Water Points'],
    suitableFor: ['Flat Waterfront Jogging', 'Morning 5K']
  },

  // South Region
  {
    id: 'south-southern-ridges',
    name: 'The Southern Ridges & Telok Blangah',
    region: 'south',
    latitude: 1.2801,
    longitude: 103.8123,
    description: 'Epic 10km canopy trail traversing Henderson Waves, Mount Faber, and Forest Walk.',
    trackLengthKm: 10.0,
    surface: 'Elevated Metal Grid & Paved Trails',
    lighting: 'Lit until 12:00 AM (Henderson Waves lit until 2:00 AM)',
    amenities: ['Restrooms', 'Lookout Terraces', 'MRT Harbuorfront Access'],
    suitableFor: ['Canopy Long Jogs', 'Hill Climbing', 'Architectural Runs']
  },
  {
    id: 'south-marina-barrage-gardens',
    name: 'Marina Barrage & Gardens by the Bay',
    region: 'south',
    latitude: 1.2806,
    longitude: 103.8636,
    description: 'Iconic panoramic route looping around Bay East, Marina Reservoir, and Supertrees.',
    trackLengthKm: 5.5,
    surface: 'Wide Paved Granite & Asphalt',
    lighting: '24/7 Illumination',
    amenities: ['Water Coolers', 'Lockers', 'Showers nearby', 'F&B Hubs', 'Visitor Restrooms'],
    suitableFor: ['Scenic City Jogging', 'Night Skyline Running', 'Marathon Segments']
  },
  {
    id: 'south-labrador-nature-reserve',
    name: 'Labrador Nature Reserve',
    region: 'south',
    latitude: 1.2673,
    longitude: 103.8024,
    description: 'Rocky sea-cliff jogging trail with mangrove boardwalk and WWII artillery relic route.',
    trackLengthKm: 4.1,
    surface: 'Paved Coastal Track & Timber Boardwalk',
    lighting: 'Lit until 10:00 PM',
    amenities: ['Restrooms', 'Heritage Markers', 'Berlayer Creek Connector'],
    suitableFor: ['Coastal Sea-Breeze Runs', 'Tempo Waterfront Strides']
  }
];

export const SINGAPORE_MALLS: MallLocation[] = [
  // Central Region Malls
  {
    id: 'mall-central-ion',
    name: 'ION Orchard',
    region: 'central',
    latitude: 1.3040,
    longitude: 103.8318,
    description: 'Iconic multi-tier indoor complex with continuous underground passages connecting to Orchard MRT.',
    indoorWalkingLoopKm: 1.8,
    levels: 8,
    mrtStation: 'Orchard (NS22/TE14)',
    amenities: ['Full Air-Conditioning', 'Water Refill Stations', 'Baggage Lockers', 'Underground Mall Concourse'],
    indoorHighlights: ['HEPA Filtered Air', 'Wide Marble Corridors', 'Indoor Stepped Exercising']
  },
  {
    id: 'mall-central-plaza-sing',
    name: 'Plaza Singapura',
    region: 'central',
    latitude: 1.3007,
    longitude: 103.8453,
    description: 'Long horizontal 9-storey concourse with wide atrium loops perfect for indoor power-walking.',
    indoorWalkingLoopKm: 1.5,
    levels: 9,
    mrtStation: 'Dhoby Ghaut (NS24/NE6/CC1)',
    amenities: ['Sheltered Interchange', 'Rest Areas', 'Gym Pods', 'Multiple Cafes'],
    indoorHighlights: ['Uninterrupted Floor Corridors', 'Cool Constant 23°C Climate']
  },
  {
    id: 'mall-central-junction8',
    name: 'Junction 8 (Bishan)',
    region: 'central',
    latitude: 1.3506,
    longitude: 103.8488,
    description: 'Convenient Bishan hub with dual level shopping galleries and direct sheltered bus/MRT interchange.',
    indoorWalkingLoopKm: 1.1,
    levels: 5,
    mrtStation: 'Bishan (NS17/CC15)',
    amenities: ['Roof Terrace', 'Air-Conditioned Food Courts', 'Direct MRT Integration'],
    indoorHighlights: ['Compact Exercise Walking Loops', 'Immediate Safe Indoor Respite']
  },
  {
    id: 'mall-central-suntec',
    name: 'Suntec City Mall',
    region: 'central',
    latitude: 1.2935,
    longitude: 103.8572,
    description: 'One of Singapore largest mega-malls with 4 distinct wings forming an expansive 3.2km loop.',
    indoorWalkingLoopKm: 3.2,
    levels: 4,
    mrtStation: 'Promenade (CC4/DT15) & Esplanade (CC3)',
    amenities: ['TrueFitness Gym', 'Lockers', 'Wide Concourse Lanes', 'Hydration Dispensers'],
    indoorHighlights: ['Long Continuous Indoor Track Equivalent', 'Spacious Atriums for Walking']
  },

  // East Region Malls
  {
    id: 'mall-east-jewel',
    name: 'Jewel Changi Airport',
    region: 'east',
    latitude: 1.3602,
    longitude: 103.9898,
    description: 'World-renowned indoor sanctuary with lush Shiseido Forest Valley walking trails in climate-controlled bliss.',
    indoorWalkingLoopKm: 2.5,
    levels: 5,
    mrtStation: 'Changi Airport (CG2)',
    amenities: ['Indoor Forest Trails', 'Showers & Luggage Storage', '24/7 Security & Restrooms', 'Pure Air Filtration'],
    indoorHighlights: ['Indoor Rainforest Trails', 'Vortex Waterfall Misting', 'Multi-Level Canopy Walks']
  },
  {
    id: 'mall-east-tampines-mall',
    name: 'Tampines Mall & Century Square Hub',
    region: 'east',
    latitude: 1.3532,
    longitude: 103.9452,
    description: 'Interconnected twin mall cluster in the heart of Tampines with sheltered cross-links.',
    indoorWalkingLoopKm: 2.0,
    levels: 6,
    mrtStation: 'Tampines (EW2/DT32)',
    amenities: ['Anytime Fitness', 'Filtered Water Points', 'Rest Benches on every floor'],
    indoorHighlights: ['Inter-Mall Covered Skybridges', 'High-Ceiling Ventilated Corridors']
  },
  {
    id: 'mall-east-parkway-parade',
    name: 'Parkway Parade (Marine Parade)',
    region: 'east',
    latitude: 1.3015,
    longitude: 103.9052,
    description: 'East coast primary shopping destination with wide perimeter walking wings.',
    indoorWalkingLoopKm: 1.4,
    levels: 7,
    mrtStation: 'Marine Parade (TE26)',
    amenities: ['Fitness First Gym', 'Sheltered Drop-off', 'Air-Conditioned Rest Lounges'],
    indoorHighlights: ['Generous Walkway Clearance', 'Immediate Coastal Indoor Shelter']
  },
  {
    id: 'mall-east-plq',
    name: 'Paya Lebar Quarter (PLQ Mall)',
    region: 'east',
    latitude: 1.3175,
    longitude: 103.8927,
    description: 'State-of-the-art modern mixed development with high indoor air exchange ratings.',
    indoorWalkingLoopKm: 1.6,
    levels: 6,
    mrtStation: 'Paya Lebar (EW8/CC9)',
    amenities: ['Virgin Active Gym', 'Lockers', 'Healthy Eateries', 'Covered Linkways'],
    indoorHighlights: ['Green Mark Platinum Indoor Air Quality', 'Wide Walkways']
  },

  // West Region Malls
  {
    id: 'mall-west-westgate-jem',
    name: 'Westgate & Jem Complex (Jurong East)',
    region: 'west',
    latitude: 1.3331,
    longitude: 103.7436,
    description: 'Dual interconnected megamall in Jurong Lake District with over 3km of air-conditioned walkways.',
    indoorWalkingLoopKm: 2.8,
    levels: 7,
    mrtStation: 'Jurong East (NS1/EW24)',
    amenities: ['Fitness First Gym', 'Hydration Points', 'Direct Hospital & MRT Linkways'],
    indoorHighlights: ['Twin Atrium Indoor Stride Route', 'Extensive Shaded Indoor Connectors']
  },
  {
    id: 'mall-west-jurong-point',
    name: 'Jurong Point Shopping Centre',
    region: 'west',
    latitude: 1.3404,
    longitude: 103.7067,
    description: 'Largest suburban mall in Singapore with two vast retail wings and extensive streetscapes indoors.',
    indoorWalkingLoopKm: 2.4,
    levels: 6,
    mrtStation: 'Boon Lay (EW27)',
    amenities: ['Community Club', '24/7 Gym Pods', 'Medical Hub', 'Multiple Level Restrooms'],
    indoorHighlights: ['Massive Flat Surface Walk Space', 'Air Conditioned Safe Haven']
  },
  {
    id: 'mall-west-clementi-mall',
    name: 'The Clementi Mall',
    region: 'west',
    latitude: 1.3152,
    longitude: 103.7652,
    description: 'Compact vertical complex integrated with bus interchange and Clementi MRT station.',
    indoorWalkingLoopKm: 1.0,
    levels: 5,
    mrtStation: 'Clementi (EW23)',
    amenities: ['Public Library', 'Food Courts', 'Direct Covered Access'],
    indoorHighlights: ['Air Conditioned Vertical Fitness', 'Convenient West Hub']
  },

  // North Region Malls
  {
    id: 'mall-north-northpoint-city',
    name: 'Northpoint City (Yishun)',
    region: 'north',
    latitude: 1.4296,
    longitude: 103.8358,
    description: 'Largest shopping mall in Northern Singapore spanning North and South wings with 500+ stores.',
    indoorWalkingLoopKm: 2.7,
    levels: 4,
    mrtStation: 'Yishun (NS13)',
    amenities: ['Anytime Fitness', 'Rooftop Community Club', 'Air-Conditioned Underground Bunkers'],
    indoorHighlights: ['Massive Dual-Wing Indoor Loops', 'Seamlessly Sheltered from Haze & Heat']
  },
  {
    id: 'mall-north-causeway-point',
    name: 'Causeway Point (Woodlands)',
    region: 'north',
    latitude: 1.4361,
    longitude: 103.7865,
    description: 'Prominent 7-level regional center in Woodlands with wide circular central atrium.',
    indoorWalkingLoopKm: 1.6,
    levels: 7,
    mrtStation: 'Woodlands (NS9/TE2)',
    amenities: ['Gym Facilities', 'Water Dispensers', 'Direct Bus Interchange'],
    indoorHighlights: ['Continuous Circular Walking Floors', 'High-Grade Indoor Air Handling']
  },
  {
    id: 'mall-north-waterway-point',
    name: 'Waterway Point (Punggol)',
    region: 'north',
    latitude: 1.4067,
    longitude: 103.9022,
    description: 'East and West wings wrapped along Punggol Waterway with scenic indoor glass promenades.',
    indoorWalkingLoopKm: 2.2,
    levels: 4,
    mrtStation: 'Punggol (NE17/PTC)',
    amenities: ['Cinema Complex', '24/7 Supermarket', 'Benches with charging sockets'],
    indoorHighlights: ['Waterfront-facing Indoor Views', 'Spacious Breezy Air-Conditioned Loops']
  },

  // South Region Malls
  {
    id: 'mall-south-vivocity',
    name: 'VivoCity (HarbourFront)',
    region: 'south',
    latitude: 1.2642,
    longitude: 103.8223,
    description: 'Largest retail mall in Singapore by gross floor area, designed by Toyo Ito with wide open concourses.',
    indoorWalkingLoopKm: 3.5,
    levels: 4,
    mrtStation: 'HarbourFront (NE1/CC29)',
    amenities: ['Sky Park Walkway', 'Showers at Fitness First', 'Filtered Hydration Hubs', 'Sentosa Gateway Link'],
    indoorHighlights: ['Expansive Single-Floor Stride Lengths', 'Direct Connection to HarbourFront Centre']
  },
  {
    id: 'mall-south-marina-square',
    name: 'Marina Square & Millenia Walk',
    region: 'south',
    latitude: 1.2913,
    longitude: 103.8579,
    description: 'Wide, uncrowded architecturally spacious corridors designed for leisurely indoor exercise walking.',
    indoorWalkingLoopKm: 2.1,
    levels: 4,
    mrtStation: 'City Hall (NS25/EW13) & Esplanade (CC3)',
    amenities: ['Spacious Corridors', 'Indoor Playgrounds', 'Resting Lounges', 'Water Refill'],
    indoorHighlights: ['Very Low Footfall Density', 'Ideal Peaceful Indoor Walking Sanctuary']
  }
];

export const REGION_CENTERS: Record<string, { lat: number; lng: number; name: string }> = {
  central: { lat: 1.35735, lng: 103.82, name: 'Central' },
  north: { lat: 1.41803, lng: 103.82, name: 'North' },
  south: { lat: 1.29587, lng: 103.82, name: 'South' },
  east: { lat: 1.35735, lng: 103.94, name: 'East' },
  west: { lat: 1.35735, lng: 103.70, name: 'West' }
};

// Calculate Haversine distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Find closest region for given lat/lng
export function determineRegionFromCoords(lat: number, lng: number): 'north' | 'south' | 'east' | 'west' | 'central' {
  let closest: 'north' | 'south' | 'east' | 'west' | 'central' = 'central';
  let minDistance = Infinity;

  for (const [region, coords] of Object.entries(REGION_CENTERS)) {
    const dist = calculateDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = region as any;
    }
  }

  return closest;
}
