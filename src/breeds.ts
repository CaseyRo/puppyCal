export type BreedId =
  | 'stabyhoun'
  | 'kooikerhondje'
  | 'wetterhoun'
  | 'dutch-shepherd'
  | 'keeshond'
  | 'markiesje'
  | 'drentsche-patrijshond'
  | 'saarloos-wolfdog'
  | 'schapendoes'
  | 'golden-retriever'
  | 'labrador-retriever'
  | 'french-bulldog'
  | 'german-shepherd'
  | 'jack-russell-terrier'
  | 'chihuahua'
  | 'cocker-spaniel'
  | 'boxer'
  | 'other';

export interface BreedInfo {
  id: BreedId;
  nameEn: string;
  nameNl: string;
  breedSize: 'small' | 'medium' | 'large' | 'giant';
  isNativeDutch: boolean;
}

export const BREEDS: BreedInfo[] = [
  // Dutch breeds
  {
    id: 'stabyhoun',
    nameEn: 'Stabyhoun',
    nameNl: 'Stabyhoun',
    breedSize: 'medium',
    isNativeDutch: true,
  },
  {
    id: 'kooikerhondje',
    nameEn: 'Kooikerhondje',
    nameNl: 'Kooikerhondje',
    breedSize: 'small',
    isNativeDutch: true,
  },
  {
    id: 'wetterhoun',
    nameEn: 'Wetterhoun',
    nameNl: 'Wetterhoun',
    breedSize: 'large',
    isNativeDutch: true,
  },
  {
    id: 'dutch-shepherd',
    nameEn: 'Dutch Shepherd',
    nameNl: 'Hollandse Herder',
    breedSize: 'large',
    isNativeDutch: true,
  },
  {
    id: 'keeshond',
    nameEn: 'Keeshond',
    nameNl: 'Keeshond',
    breedSize: 'medium',
    isNativeDutch: true,
  },
  {
    id: 'markiesje',
    nameEn: 'Markiesje',
    nameNl: 'Markiesje',
    breedSize: 'small',
    isNativeDutch: true,
  },
  {
    id: 'drentsche-patrijshond',
    nameEn: 'Drentsche Patrijshond',
    nameNl: 'Drentsche Patrijshond',
    breedSize: 'large',
    isNativeDutch: true,
  },
  {
    id: 'saarloos-wolfdog',
    nameEn: 'Saarloos Wolfdog',
    nameNl: 'Saarlooswolfhond',
    breedSize: 'giant',
    isNativeDutch: true,
  },
  {
    id: 'schapendoes',
    nameEn: 'Schapendoes',
    nameNl: 'Schapendoes',
    breedSize: 'medium',
    isNativeDutch: true,
  },
  // Other breeds
  {
    id: 'golden-retriever',
    nameEn: 'Golden Retriever',
    nameNl: 'Golden Retriever',
    breedSize: 'large',
    isNativeDutch: false,
  },
  {
    id: 'labrador-retriever',
    nameEn: 'Labrador Retriever',
    nameNl: 'Labrador Retriever',
    breedSize: 'large',
    isNativeDutch: false,
  },
  {
    id: 'french-bulldog',
    nameEn: 'French Bulldog',
    nameNl: 'Franse Bulldog',
    breedSize: 'small',
    isNativeDutch: false,
  },
  {
    id: 'german-shepherd',
    nameEn: 'German Shepherd',
    nameNl: 'Duitse Herder',
    breedSize: 'large',
    isNativeDutch: false,
  },
  {
    id: 'jack-russell-terrier',
    nameEn: 'Jack Russell Terrier',
    nameNl: 'Jack Russell Terrier',
    breedSize: 'small',
    isNativeDutch: false,
  },
  {
    id: 'chihuahua',
    nameEn: 'Chihuahua',
    nameNl: 'Chihuahua',
    breedSize: 'small',
    isNativeDutch: false,
  },
  {
    id: 'cocker-spaniel',
    nameEn: 'Cocker Spaniel',
    nameNl: 'Cocker Spaniel',
    breedSize: 'medium',
    isNativeDutch: false,
  },
  { id: 'boxer', nameEn: 'Boxer', nameNl: 'Boxer', breedSize: 'medium', isNativeDutch: false },
  {
    id: 'other',
    nameEn: 'Other / mixed',
    nameNl: 'Ander / kruising',
    breedSize: 'medium',
    isNativeDutch: false,
  },
];

export function getBreed(id: BreedId): BreedInfo {
  return BREEDS.find((b) => b.id === id) ?? (BREEDS.find((b) => b.id === 'other') as BreedInfo);
}
