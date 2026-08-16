export const RIDE_TYPES = [
  {
    id: 'uberx',
    type: 'UberX',
    icon: '🚗',
    basePrice: 5,
    perKm: 1.2,
    capacity: 4,
    affordable: true,
    description: 'Affordable, everyday rides',
  },
  {
    id: 'uberxl',
    type: 'UberXL',
    icon: '🚐',
    basePrice: 8,
    perKm: 1.8,
    capacity: 6,
    affordable: false,
    description: 'Rides for groups up to 6',
  },
  {
    id: 'comfort',
    type: 'Uber Comfort',
    icon: '🛻',
    basePrice: 10,
    perKm: 2.1,
    capacity: 4,
    affordable: false,
    description: 'Extra legroom, top-rated drivers',
  },
  {
    id: 'green',
    type: 'Uber Green',
    icon: '🌿',
    basePrice: 7,
    perKm: 1.5,
    capacity: 4,
    affordable: false,
    description: 'Eco-friendly electric vehicles',
  },
];

export function getRideType(id) {
  return RIDE_TYPES.find((r) => r.id === id) || null;
}
