'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { OptionPicker } from '@/components/shared';
import { TagPillInput } from '@/components/shared/tag-pill';

import {
  useAdminBrandsQuery,
  useAdminCategoriesQuery,
  useAdminCollectionsQuery,
  useAdminSizesQuery,
} from '@/hooks/use-catalog.hook';
import {
  useAdminProductDetailQuery,
  useUpdateAdminProductMutation,
} from '@/hooks/use-product.hook';
import { UpdateProductInput, updateProductSchema } from '@/schemas/update-product.schema';
import { Gender } from '@/types/shared/product';
import { UpdateProductVariantMatrix } from './product-variant-update';
import { UpdateProductColorManager } from './update-color';
import { UpdateProductMediaUpload } from './media-update';
import { toast } from '@/components/toast/toast';

type Option = { value: string; label: string; id: string };

const PRODUCT_TYPE_OPTIONS: Option[] = [
  { value: 'sneaker', label: 'SNEAKER', id: 'sneaker' },
  { value: 'apparel', label: 'APPAREL', id: 'apparel' },
  { value: 'accessory', label: 'ACCESSORY', id: 'accessory' },
  { value: 'equipment', label: 'EQUIPMENT', id: 'equipment' },
];

const GENDER_OPTIONS: Option[] = [
  { value: 'men', label: 'Men', id: 'men' },
  { value: 'women', label: 'Women', id: 'women' },
  { value: 'unisex', label: 'Unisex', id: 'unisex' },
  { value: 'kids', label: 'Kids', id: 'kids' },
];

const ACTIVE_STATUS_OPTIONS: Option[] = [
  { value: 'true', label: 'Active (Visible on Storefront)', id: 'true' },
  { value: 'false', label: 'Inactive (Hidden / Draft)', id: 'false' },
];

export function ProductUpdate({
  id,
  setValue,
}: {
  id: string;
  setValue: (value: boolean) => void;
}) {
  const { data: product, isLoading: isProductLoading } = useAdminProductDetailQuery(id);
  const { data: brand } = useAdminBrandsQuery();
  const { data: category } = useAdminCategoriesQuery();
  const { data: collection } = useAdminCollectionsQuery();
  const { data: available_size } = useAdminSizesQuery();
  const { mutate: update_product } = useUpdateAdminProductMutation();

  const isDeleting = false;

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
  });

  useEffect(() => {
    if (product) {
      reset({
        product_name: product.name ?? '',
        product_slug: product.slug ?? '',
        product_brand:
          product.brand?.id ??
          product.brand?.id ??
          (typeof product.brand === 'string' ? product.brand : null),
        product_category:
          product.category?.id ??
          product.category?.id ??
          (typeof product.category === 'string' ? product.category : null),
        product_collections: product.collections?.map((c: any) => c.id ?? c._id ?? c) ?? [],
        product_gender: (product.gender as Gender) ?? undefined,
        product_productType: product.productType ?? undefined,
        product_pricing: {
          currency: product.pricing?.currency ?? 'USD',
          basePrice: product.pricing?.basePrice ?? 0,
          compareAtPrice: product.pricing?.compareAtPrice ?? null,
          costPrice: product.pricing?.costPrice ?? null,
        },
        product_colors:
          product.colors?.map((c: any) => ({
            id: c.id ?? c._id,
            tempId: c.tempId ?? c.id ?? c._id,
            name: c.name ?? '',
            hexCode: c.hexCode ?? '',
            swatchImage: c.swatchImage ?? null,
          })) ?? [],
        product_variants:
          product.variants?.map((v: any) => ({
            id: v.id ?? v._id ?? null,
            colorId: v.colorId ?? '',
            sizeId: v.sizeId?.id ?? v.sizeId?._id ?? v.sizeId ?? '',
            size: v.size ?? '',
            sku: v.sku ?? null,
            barcode: v.barcode ?? null,
            stockQuantity: v.stockQuantity ?? 0,
            reservedQuantity: v.reservedQuantity ?? 0,
            availableQuantity: v.availableQuantity ?? 0,
            reorderLevel: v.reorderLevel ?? 5,
            active: v.active ?? true,
            priceOverride: v.priceOverride ?? null,
          })) ?? [],
        product_media:
          product.media?.map((m: any) => ({
            id: m.id ?? m._id ?? null,
            key: m.key ?? m.id ?? m._id ?? null,
            url: m.url ?? '',
            alt: m.alt ?? 'Product media',
            type: (m.type as 'image' | 'video') ?? 'image',
            order: m.order ?? 0,
            colorId: m.colorId ?? undefined,
            isNew: m.isNew ?? false,
          })) ?? [],
        product_features: product.features ?? [],
        product_description: {
          narrative: product.description?.narrative ?? '',
          styleCode: product.description?.styleCode ?? null,
          fitType: product.description?.fitType ?? null,
          fabricComposition: product.description?.fabricComposition ?? null,
          careInstructions: product.description?.careInstructions ?? [],
          editorialHighlights: product.description?.editorialHighlights ?? [],
          additionalSections: product.description?.additionalSections ?? [],
        },
        product_seo: {
          title: product.seo?.title ?? '',
          description: product.seo?.description ?? '',
          keywords: product.seo?.keywords ?? [],
        },
        product_tags: product.tags ?? [],
        product_active: product.active ?? true,
        product_publishedAt: product.publishedAt ?? null,
      });
    }
  }, [product, reset]);

  const watchedColors = watch('product_colors') ?? [];
  const mediaCount = watch('product_media')?.length ?? 0;

  const watchedColorsMapped = useMemo(() => {
    return watchedColors.map((c) => ({
      id: c.id,
      tempId: c.tempId || c.id || '',
      name: c.name ?? '',
      hexCode: c.hexCode ?? '',
    }));
  }, [watchedColors]);

  const onSubmit = async (data: UpdateProductInput) => {
    await toast.promise(
      new Promise((resolve, reject) => {
        update_product(
          { data: data, productId: id },
          {
            onSuccess: (response) => {
              setValue(false);
              resolve(response);
            },
            onError: (err) => reject(err),
          }
        );
      }),
      {
        pending: 'Updating.. product…',
        success: 'Product Updated',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
  };

  if (isProductLoading) {
    return (
      <div className="flex items-center justify-center p-12 font-archivo text-xs uppercase tracking-wider text-neutral-500">
        Loading product details…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 font-archivo">
        {/* Product Active Status (Custom Select) */}
        <Controller
          name="product_active"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Status"
              error={errors.product_active?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                value={field.value !== undefined ? String(field.value) : 'true'}
                options={ACTIVE_STATUS_OPTIONS}
                onChange={(val) => field.onChange(val === 'true')}
                disabled={isSubmitting}
                hasError={!!errors.product_active}
                placeholder="Select visibility status"
              />
            </Field>
          )}
        />

        {/* Product Name */}
        <Field
          label="Product Name"
          error={errors.product_name?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_name')}
            type="text"
            placeholder="e.g. Air Jordan 1 Retro High OG"
            hasError={!!errors.product_name}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Product Brand */}
        <Controller
          control={control}
          name="product_brand"
          render={({ field }) => (
            <Field
              label="Product Brand"
              error={errors.product_brand?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                options={
                  brand?.brands.map((b) => ({
                    value: b.id,
                    id: b.id,
                    label: b.name.toUpperCase(),
                  })) ?? []
                }
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_brand}
                placeholder="Select a brand"
              />
            </Field>
          )}
        />

        {/* Product Category */}
        <Controller
          control={control}
          name="product_category"
          render={({ field }) => (
            <Field
              label="Product Category"
              error={errors.product_category?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                options={
                  category?.categories.map((c) => ({
                    value: c.id,
                    id: c.id,
                    label: c.name.toUpperCase(),
                  })) ?? []
                }
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_category}
                placeholder="Select a category"
              />
            </Field>
          )}
        />

        {/* Product Collections */}
        <Controller
          name="product_collections"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Collections"
              error={errors.product_collections?.message as string | undefined}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <OptionPicker
                multiple
                value={field.value ?? []}
                options={
                  collection?.collections.map((cl) => ({
                    value: cl.id,
                    id: cl.id,
                    label: cl.name.toLowerCase(),
                  })) ?? []
                }
                onChange={(next) => field.onChange(Array.isArray(next) ? next : next ? [next] : [])}
                placeholder="Select collections"
                disabled={isSubmitting}
              />
            </Field>
          )}
        />

        {/* Product Gender */}
        <Controller
          name="product_gender"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Gender"
              error={errors.product_gender?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                value={field.value ?? ''}
                options={GENDER_OPTIONS}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_gender}
                placeholder="Select target demographic"
              />
            </Field>
          )}
        />

        {/* Product Type */}
        <Controller
          name="product_productType"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Type"
              error={errors.product_productType?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                value={field.value ?? ''}
                options={PRODUCT_TYPE_OPTIONS}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_productType}
                placeholder="Select catalog type"
              />
            </Field>
          )}
        />

        {/* Pricing Sub-fields */}
        <Field
          label="Product Currency"
          error={errors.product_pricing?.currency?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_pricing.currency')}
            type="text"
            placeholder="e.g. USD, NGN, EUR"
            hasError={!!errors.product_pricing?.currency}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Base Price"
          error={errors.product_pricing?.basePrice?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_pricing.basePrice', { valueAsNumber: true })}
            type="number"
            placeholder="e.g. 15000"
            hasError={!!errors.product_pricing?.basePrice}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Compare Price"
          error={errors.product_pricing?.compareAtPrice?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_pricing.compareAtPrice', { valueAsNumber: true })}
            type="number"
            placeholder="e.g. 20000"
            hasError={!!errors.product_pricing?.compareAtPrice}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Product Colors Manager */}
        <Field
          label="Product Colors"
          error={errors.product_colors?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            control={control}
            name="product_colors"
            render={({ field }) => (
              <UpdateProductColorManager
                value={
                  field.value?.map((c) => ({
                    id: c.id,
                    tempId: c.tempId || c.id || '',
                    name: c.name ?? '',
                    hexCode: c.hexCode ?? '',
                    swatchImage: c.swatchImage ?? undefined,
                  })) ?? []
                }
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_colors}
              />
            )}
          />
        </Field>

        {/* Variants Matrix */}
        <Field
          label="Product Variants (Inventory Matrix)"
          error={errors.product_variants?.message as string | undefined}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            control={control}
            name="product_variants"
            render={({ field }) => (
              <UpdateProductVariantMatrix
                colors={watchedColorsMapped}
                availableSizes={
                  available_size?.sizes.map((s) => ({
                    id: s.id,
                    name: s.name.toUpperCase(),
                  })) ?? []
                }
                value={
                  field.value?.map((v) => ({
                    id: v.id ?? undefined,
                    colorId: v.colorId ?? '',
                    sizeId: v.sizeId ?? '',
                    size: v.size ?? '',
                    sku: v.sku ?? null,
                    barcode: v.barcode ?? null,
                    stockQuantity: v.stockQuantity ?? 0,
                    reservedQuantity: v.reservedQuantity ?? 0,
                    availableQuantity: v.availableQuantity ?? 0,
                    reorderLevel: v.reorderLevel ?? 5,
                    active: v.active ?? true,
                    priceOverride: v.priceOverride ?? null,
                  })) ?? []
                }
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        {/* Product Media */}
        <div className="flex flex-col gap-1.5">
          <label className="font-archivo text-xs font-semibold uppercase tracking-wider text-black">
            Product Media
            <span className="ml-1 font-normal normal-case text-neutral-500">
              ({mediaCount} uploaded)
            </span>
          </label>
          <Controller
            name="product_media"
            control={control}
            render={({ field }) => (
              <UpdateProductMediaUpload
                productId={id}
                colors={watchedColorsMapped}
                value={
                  field.value?.map((m) => ({
                    id: m.id ?? undefined,
                    key: m.key ?? m.id ?? undefined,
                    url: m.url ?? '',
                    alt: m.alt ?? 'Product media',
                    type: (m.type as 'image' | 'video') ?? 'image',
                    order: m.order ?? 0,
                    colorId: m.colorId ?? undefined,
                    isNew: m.isNew ?? false,
                  })) ?? []
                }
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          {errors.product_media && (
            <p role="alert" className="font-archivo text-xs text-red-600">
              {errors.product_media.message}
            </p>
          )}
        </div>

        {/* Product Description Narrative */}
        <Field
          label="Product Narration"
          error={errors.product_description?.narrative?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Textarea
            {...register('product_description.narrative')}
            rows={4}
            placeholder="Provide a compelling product story..."
            hasError={!!errors.product_description?.narrative}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        {/* Product SEO */}
        <Field
          label="Product SEO Title"
          error={errors.product_seo?.title?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_seo.title')}
            type="text"
            placeholder="e.g. Buy Air Jordan 1 Retro High OG | Official Store"
            hasError={Boolean(errors.product_seo?.title)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product SEO Description"
          error={errors.product_seo?.description?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Textarea
            {...register('product_seo.description')}
            rows={3}
            placeholder="Write a concise meta summary for search engines (max 160 characters)..."
            hasError={Boolean(errors.product_seo?.description)}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product SEO Keywords"
          error={errors.product_seo?.keywords?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            control={control}
            name="product_seo.keywords"
            render={({ field }) => (
              <TagPillInput
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={isSubmitting}
                placeholder="e.g. sneakers, high-tops, streetwear"
                hasError={!!errors.product_seo?.keywords}
                footer_label="keyword tag"
              />
            )}
          />
        </Field>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isDeleting}
            className="font-archivo w-fit rounded-none bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Update Product'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
            className="font-archivo w-fit rounded-none bg-red-600 px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
