import { NextResponse } from 'next/server';
import { createProductSchema } from '@/lib/your-schema-file'; // Path to your Zod schema
import clientPromise from '@/lib/mongodb'; // Or your ORM/DB connection (Mongoose, Prisma, etc.)
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate payload against the schema on the server boundary
    const result = createProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid product payload', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;
    const client = await clientPromise;
    const db = client.db('your_database_name');

    // =========================================================================
    // STEP 2: Process & Insert Colors (Mapping Frontend tempIds to DB _ids)
    // =========================================================================
    const tempIdToRealObjectIdMap = new Map<string, ObjectId>();
    const insertedColors = [];

    for (const color of data.product_colors) {
      const realColorId = new ObjectId(); // Generate real MongoDB ID
      tempIdToRealObjectIdMap.set(color.tempId, realColorId);

      insertedColors.push({
        _id: realColorId,
        name: color.name,
        hexCode: color.hexCode ?? null,
        swatchImage: color.swatchImage ?? null,
      });
    }

    // Insert colors into database (if your design requires a standalone colors collection)
    if (insertedColors.length > 0) {
      await db.collection('product_colors').insertMany(insertedColors);
    }

    // =========================================================================
    // STEP 3: Process Variants (Auto-generate SKUs & remap colorIds)
    // =========================================================================
    const processedVariants = data.product_variants.map((variant, index) => {
      // Map frontend tempId to actual MongoDB ObjectId
      const mappedColorId = tempIdToRealObjectIdMap.get(variant.colorId);
      if (!mappedColorId) {
        throw new Error(`Variant at index ${index} points to an invalid color reference.`);
      }

      // Auto-generate SKU if blank/missing: e.g., "PROD-COLORID-SIZE"
      let finalSku = variant.sku ? variant.sku.trim().toUpperCase() : '';
      if (!finalSku) {
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        finalSku = `SKU-${mappedColorId.toString().slice(-6)}-${variant.size.replace(/\s+/g, '')}-${randomSuffix}`;
      }

      return {
        _id: new ObjectId(),
        colorId: mappedColorId,
        sizeId: new ObjectId(variant.sizeId),
        size: variant.size,
        sku: finalSku, // Guaranteed unique or auto-assigned SKU
        barcode: variant.barcode ?? null,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
        availableQuantity: variant.availableQuantity,
        reorderLevel: variant.reorderLevel,
        active: variant.active ?? true,
        priceOverride: variant.priceOverride ?? null,
      };
    });

    // =========================================================================
    // STEP 4: Construct Final Product Document & Save
    // =========================================================================
    const newProduct = {
      product_name: data.product_name,
      product_category_id: new ObjectId(data.product_category_id),
      product_brand_id: new ObjectId(data.product_brand_id),
      product_collections_id: data.product_collections_id?.map((id) => new ObjectId(id)) || [],
      product_currency: data.product_currency || 'USD',
      product_basePrice: data.product_basePrice,
      product_compareAtPrice: data.product_compareAtPrice ?? null,
      product_costPrice: data.product_costPrice ?? null,
      product_features: data.product_features || [],
      product_media: data.media || [],
      product_description: data.product_description || null,
      product_seo_title: data.product_seo_title || null,
      productType: data.productType,
      product_gender: data.product_gender,
      product_tags: data.product_tags || [],
      product_active: data.product_active ?? true,

      // Store references & embedded variant info
      colors: Array.from(tempIdToRealObjectIdMap.values()),
      variants: processedVariants,
      createdAt: new Date(),
    };

    const insertResponse = await db.collection('products').insertOne(newProduct);

    return NextResponse.json(
      { success: true, productId: insertResponse.insertedId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Product Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
