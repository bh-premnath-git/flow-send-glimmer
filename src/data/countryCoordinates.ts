export type CountryCoordinateMap = Record<string, {
  name: string;
  coordinates: [number, number];
}>;

export const countryCoordinates: CountryCoordinateMap = {
  UK: { name: 'United Kingdom', coordinates: [-0.118092, 51.509865] },
  US: { name: 'United States', coordinates: [-73.935242, 40.73061] },
  IN: { name: 'India', coordinates: [77.209, 28.6139] },
  CA: { name: 'Canada', coordinates: [-79.3832, 43.6532] },
  AU: { name: 'Australia', coordinates: [151.2093, -33.8688] },
  DE: { name: 'Germany', coordinates: [13.405, 52.52] },
  FR: { name: 'France', coordinates: [2.3522, 48.8566] },
  JP: { name: 'Japan', coordinates: [139.6917, 35.6895] },
  SG: { name: 'Singapore', coordinates: [103.8198, 1.3521] },
  MX: { name: 'Mexico', coordinates: [-99.1332, 19.4326] },
  AE: { name: 'United Arab Emirates', coordinates: [55.2708, 25.2048] },
  BR: { name: 'Brazil', coordinates: [-46.6333, -23.5505] },
  ZA: { name: 'South Africa', coordinates: [28.0473, -26.2041] },
  CN: { name: 'China', coordinates: [116.4074, 39.9042] },
};

export const getCountryCoordinates = (countryCode: string) =>
  countryCoordinates[countryCode]?.coordinates ?? null;

export const getCountryName = (countryCode: string) => countryCoordinates[countryCode]?.name ?? countryCode;
