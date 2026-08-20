declare module 'rwanda-geo-structure' {
  export function getProvinces(): string[];
  export function getDistrictsByProvince(province: string): string[];
  export function getSectorsByDistrict(province: string, district: string): string[];
}
