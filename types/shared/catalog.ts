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
export type ProductReference = {
  id: string;
  name: string | null;
  slug: string | null;
};
export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: ProductReference | null;
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
};

///

export type AdminBrandListParams = {
  search?: string;
  active?: boolean;
};

export type AdminCategoryListParams = {
  search?: string;
  active?: boolean;
  parent?: string | null;
};

export type AdminCollectionListParams = {
  search?: string;
  active?: boolean;
};

export type AdminSizeListParams = {
  search?: string;
};
