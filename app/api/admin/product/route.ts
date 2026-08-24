import { createProductSchema } from '@/schemas/create-product.schema';
import { ClothingProductData } from '@/types/shared/product';
import { NextResponse } from 'next/server';
// Or your ORM/DB connection (Mongoose, Prisma, etc.)

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

    console.log(result.data);

    const data: ClothingProductData[] = [];

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Product Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
