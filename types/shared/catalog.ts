export type BrandData = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CollectionData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  image: string | null;
};

export type SizeData = {
  id: string;
  name: string;
  slug: string;
};
