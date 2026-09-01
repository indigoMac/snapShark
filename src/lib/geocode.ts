export type GeocodeResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  kind: 'place' | 'coordinates';
};
