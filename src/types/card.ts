export type CardTheme = 'porcelain' | 'obsidian' | 'spruce';

export type Language = 'zh' | 'en';

export interface BusinessCardData {
  avatarUrl: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  bio: string;
  theme: CardTheme;
}

export interface StoredBusinessCard extends BusinessCardData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_AVATAR_URL =
  '/src/assets/images/executive_portrait_avatar_1795577279750.jpg';

export const DEFAULT_CARD_DATA: BusinessCardData = {
  avatarUrl: DEFAULT_AVATAR_URL,
  fullName: 'Rachel Lin 林思敏',
  title: 'Agency Manager',
  company: 'Action Force Sdn Bhd',
  phone: '+60 12-345 6789',
  email: 'rachel.lin@vanguard.my',
  website: 'https://vanguard.my',
  location: 'Kuala Lumpur, Malaysia',
  bio: 'Helping growth-stage brands build clear market positioning and lasting customer trust.',
  theme: 'porcelain',
};
