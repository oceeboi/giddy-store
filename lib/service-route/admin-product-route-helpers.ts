import 'server-only';

import Brand from '@/models/Brand';
import Category from '@/models/Category';
import Collection from '@/models/Collection';
import ProductSize from '@/models/ProductSize';

export interface ProductRelationsInput {
  brandId: string;
  categoryId: string;
  collectionIds?: string[];
  sizeIds?: string[];
}

export async function validateProductRelations({
  brandId,
  categoryId,
  collectionIds = [],
  sizeIds = [],
}: ProductRelationsInput): Promise<{ error: string; status: 400 | 404 } | null> {
  // Deduplicate array IDs
  const uniqueCollectionIds = Array.from(new Set(collectionIds));
  const uniqueSizeIds = Array.from(new Set(sizeIds));

  // Run database checks in parallel
  const [brandExists, categoryExists, collectionsCount, sizesCount] = await Promise.all([
    Brand.exists({ _id: brandId }),
    Category.exists({ _id: categoryId }),
    uniqueCollectionIds.length > 0
      ? Collection.countDocuments({ _id: { $in: uniqueCollectionIds } })
      : Promise.resolve(0),
    uniqueSizeIds.length > 0
      ? ProductSize.countDocuments({ _id: { $in: uniqueSizeIds } })
      : Promise.resolve(0),
  ]);

  if (!brandExists) {
    return { error: 'The referenced Brand does not exist', status: 404 };
  }

  if (!categoryExists) {
    return { error: 'The referenced Category does not exist', status: 404 };
  }

  if (uniqueCollectionIds.length > 0 && collectionsCount !== uniqueCollectionIds.length) {
    return { error: 'One or more referenced Collections do not exist', status: 404 };
  }

  if (uniqueSizeIds.length > 0 && sizesCount !== uniqueSizeIds.length) {
    return { error: 'One or more referenced Variant Sizes do not exist', status: 404 };
  }

  return null;
}
