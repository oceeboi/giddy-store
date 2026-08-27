'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductMediaUpload } from '@/components/medias/product-media-upload';
import { toast } from '@/components/toast/toast';
import { CreateProductInput, createProductSchema } from '@/schemas/create-product.schema';
import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { OptionPicker } from '@/components/shared';
import { format_currency } from '@/utils/format';
import { TagPillInput } from '@/components/shared/tag-pill';
import { ColorPickerManager } from '@/components/shared/color-selector';
import { ProductVariantMatrix } from '@/components/shared/product-variant-matrix';
import { useCreateProduct } from '@/hooks/use-product.hook';
import {
  useAdminBrandsQuery,
  useAdminCategoriesQuery,
  useAdminCollectionsQuery,
  useAdminSizesQuery,
} from '@/hooks/use-catalog.hook';

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

export default function AdminProductsPage() {
  const [draftProductId] = useState(() => crypto.randomUUID());

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof createProductSchema>>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      product_name: '',
      product_description: {
        narrative: '',
      },
      product_category_id: '',
      product_brand_id: '',
      product_media: [],
      product_variants: [],
      product_colors: [],
    },
  });

  const mediaCount = watch('product_media')?.length ?? 0;
  const watchedColors = watch('product_colors') ?? [];

  const { mutate } = useCreateProduct();
  const { data: brand } = useAdminBrandsQuery();
  const { data: category } = useAdminCategoriesQuery();
  const { data: collection } = useAdminCollectionsQuery();
  const { data: available_size } = useAdminSizesQuery();

  const onSubmit = async (data: CreateProductInput) => {
    await toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: (response) => resolve(response),
          onError: (err) => reject(err),
        });
      }),
      {
        pending: 'Saving product…',
        success: 'Product created',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 md:p-6 md:pt-0">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Products</h1>
        <p className="font-archivo text-sm text-neutral-600">
          Manage your product catalog and inventory details.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 font-archivo">
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
          name="product_brand_id"
          render={({ field }) => (
            <Field
              label="Product Brand"
              error={errors.product_brand_id?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                options={
                  brand?.brands.map((b) => {
                    return {
                      value: b.slug,
                      id: b.id,
                      label: b.name.toLocaleUpperCase(),
                    };
                  }) ?? []
                }
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}

                hasError={!!errors.product_brand_id}
                placeholder="Select a brand"
              />
            </Field>
          )}
        />

        {/* Product Category */}
        <Controller
          control={control}
          name="product_category_id"
          render={({ field }) => (
            <Field
              label="Product Category"
              error={errors.product_category_id?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                options={
                  category?.categories.map((c) => {
                    return {
                      value: c.slug,
                      id: c.id,
                      label: c.name.toLocaleUpperCase(),
                    };
                  }) ?? []
                }
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_category_id}
                placeholder="Select a category"
              />
            </Field>
          )}
        />

        {/* Product Collections */}
        <Controller
          name="product_collections_id"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Collections"
              error={errors.product_collections_id?.message as string | undefined}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <OptionPicker
                multiple
                value={field.value ?? []}
                options={
                  collection?.collections.map((cl) => {
                    return {
                      value: cl.slug,
                      id: cl.id,
                      label: cl.name.toLocaleLowerCase(),
                    };
                  }) ?? []
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
          name="product_type"
          control={control}
          render={({ field }) => (
            <Field
              label="Product Type"
              error={errors.product_type?.message}
              delay={100}
              xx={true}
              className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
            >
              <CustomSelect
                value={field.value ?? ''}
                options={PRODUCT_TYPE_OPTIONS}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_type}
                placeholder="Select catalog type"
              />
            </Field>
          )}
        />

        {/* Currency & Prices */}
        <Field
          label="Product Currency"
          error={errors.product_currency?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_currency')}
            type="text"
            placeholder="e.g. USD, NGN, EUR"
            hasError={!!errors.product_currency}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Base Price"
          error={errors.product_basePrice?.message}
          delay={100}
          xx={true}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_basePrice')}
            type="number"
            placeholder="e.g. 15000"
            hasError={!!errors.product_basePrice}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Compare Price"
          error={errors.product_compareAtPrice?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_compareAtPrice')}
            type="number"
            placeholder="e.g. 20000 (Original price for sales)"
            hasError={!!errors.product_compareAtPrice}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Cost Price"
          error={errors.product_costPrice?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_costPrice')}
            type="number"
            placeholder="e.g. 8000 (Internal tracking cost)"
            hasError={!!errors.product_costPrice}
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
              <ColorPickerManager
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={isSubmitting}
                hasError={!!errors.product_colors}
              />
            )}
          />
        </Field>

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
              <ProductVariantMatrix
                colors={watchedColors}
                availableSizes={
                  available_size?.sizes.map((c) => {
                    return {
                      id: c.id,
                      name: c.name.toLocaleUpperCase(),
                    };
                  }) ?? []
                }
                value={field.value ?? []}
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
              <ProductMediaUpload
                productId={draftProductId}
                colors={watchedColors}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.product_media && (
            <p role="alert" className="font-archivo text-xs text-red-600">
              {errors.product_media.message}
            </p>
          )}
        </div>

        {/* Product Features */}
        <Field
          label="Product Features"
          error={errors.product_features?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            control={control}
            name="product_features"
            render={({ field }) => (
              <TagPillInput
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={isSubmitting}
                placeholder="e.g. Waterproof, Lightweight, 100% Cotton"
                hasError={!!errors.product_features}
              />
            )}
          />
        </Field>

        {/* Product Description */}
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
            placeholder="Provide a compelling product story, fit notes, and quality details..."
            hasError={!!errors.product_description?.narrative}
            disabled={isSubmitting}
            className="rounded-none"
          />
        </Field>

        <Field
          label="Product Colorway"
          error={errors.product_description?.colorway?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Input
            {...register('product_description.colorway')}
            type="text"
            placeholder="e.g. Sail / University Red / Black"
            hasError={Boolean(errors.product_description?.colorway)}
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

        {/* Product Tags */}
        <Field
          label="Product Tags"
          error={errors.product_tags?.message}
          delay={100}
          xx={false}
          className="font-archivo text-xs font-semibold uppercase tracking-wider text-black"
        >
          <Controller
            control={control}
            name="product_tags"
            render={({ field }) => (
              <TagPillInput
                value={field.value ?? []}
                onChange={field.onChange}
                disabled={isSubmitting}
                placeholder="e.g. Best Seller, New Arrival, Sale"
                hasError={!!errors.product_tags}
                footer_label="product tag"
              />
            )}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="font-archivo w-fit rounded-none bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
