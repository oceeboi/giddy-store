'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductMediaUpload } from '@/components/medias/product-media-upload';
import { toast } from '@/components/toast/toast';
import { createProductSchema } from '@/schemas/create-product.schema';
import { CustomSelect, Field, Input, Textarea } from '@/components/shared/form';
import { OptionPicker } from '@/components/shared';
import { format_currency } from '@/utils/format';
import { TagPillInput } from '@/components/shared/tag-pill';
import { ColorPickerManager } from '@/components/shared/color-selector';
import { ProductVariantMatrix } from '@/components/shared/product-variant-matrix';

type Option = { value: string; label: string; id: string };

const CATEGORY_OPTIONS: Option[] = [
  { value: 't-shirts', label: 'T-Shirts', id: '6a7b4c7734e571b38b088a23' },
  { value: 'hoodies', label: 'Hoodies', id: '6a7b4c7734e571b38b088a24' },
  { value: 'pants', label: 'Pants', id: '6a7b4c7734e571b38b088a25' },
  { value: 'sneakers', label: 'Sneakers', id: '6a7b4c7734e571b38b088a26' },
  { value: 'accessories', label: 'Accessories', id: '6a7b4c7734e571b38b088a27' },
];

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

const BRAND_OPTIONS: Option[] = [
  { value: 'nike', label: 'Nike', id: '6a7b4c7734e571b38b088a28' },
  { value: 'adidas', label: 'Adidas', id: '6a7b4c7734e571b38b088a29' },
  { value: 'puma', label: 'Puma', id: '6a7b4c7734e571b38b088a30' },
  { value: 'reebok', label: 'Reebok', id: '6a7b4c7734e571b38b088a31' },
  { value: 'new-balance', label: 'New Balance', id: '6a7b4c7734e571b38b088a32' },
];

const COLLECTIONS_OPTIONS: Option[] = [
  { value: 'SummerS22', label: 'Summer', id: '6a7b4c7734e571b38b088a23' },
  { value: 'FallAutumn22', label: 'Fall / Autumn', id: '6a7b4c7734e571b38b088a24' },
  { value: 'WinterW22', label: 'Winter', id: '6a7b4c7734e571b38b088a25' },
  { value: 'SpringS23', label: 'Spring', id: '6a7b4c7734e571b38b088a26' },
  { value: 'SummerS23', label: 'Summer 2023', id: '6a7b4c7734e571b38b088a27' },
  { value: 'HolidayFestive23', label: 'Holiday & Festive', id: '6a7b4c7734e571b38b088a28' },
  { value: 'EssentialsBasic', label: 'Core Essentials', id: '6a7b4c7734e571b38b088a29' },
  { value: 'LimitedEdition', label: 'Limited Edition', id: '6a7b4c7734e571b38b088a2a' },
];

const AVAILABLE_SIZES = [
  { id: '6a7b4c7734e571b38b088b01', name: 'US 7 / EU 40' },
  { id: '6a7b4c7734e571b38b088b02', name: 'US 8 / EU 41' },
  { id: '6a7b4c7734e571b38b088b03', name: 'US 9 / EU 42' },
  { id: '6a7b4c7734e571b38b088b04', name: 'US 10 / EU 43' },
  { id: '6a7b4c7734e571b38b088b05', name: 'US 11 / EU 44' },
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
  const onSubmit = async (data: z.input<typeof createProductSchema>) => {
    console.log('Creating product with this data:', data);
    await toast.promise(
      new Promise((resolve, reject) => {
        // Simulate an async API call or save operation using setTimeout
        setTimeout(() => {
          const success = true; // Change to false to test the error state

          if (success) {
            resolve('Product saved successfully');
          } else {
            reject(new Error('Failed to save product to database'));
          }
        }, 2000);
      }),
      {
        pending: 'Saving product…',
        success: 'Product created',
        error: (err) => (err instanceof Error ? err.message : 'Something went wrong'),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 md:p-6">
      <div>
        <h1 className="font-archivo text-2xl font-bold text-black">Products</h1>
        <p className="font-archivo text-sm text-neutral-600">Manage your products here.</p>
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
            placeholder="Product Name"
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
                options={BRAND_OPTIONS}
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
                options={CATEGORY_OPTIONS}
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
                options={COLLECTIONS_OPTIONS}
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
                placeholder="Select a Gender"
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
                placeholder="Select a Product Type"
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
            placeholder="NGN"
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
            placeholder={format_currency(0)}
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
            placeholder={format_currency(0)}
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
            placeholder={format_currency(0)}
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
                availableSizes={AVAILABLE_SIZES}
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
                colors={watchedColors} // Pass current product colors so admins can tag photos to them
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
            placeholder="Describe the product story and value proposition"
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
            placeholder="Green Spark / Black"
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
            placeholder="SEO Title"
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
            placeholder="SEO Meta Description"
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
                placeholder="e.g. Luxury, Lightweight"
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
                placeholder="e.g. Waterproof, Lightweight"
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
