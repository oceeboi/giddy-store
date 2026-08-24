import {
  CreateBrandInput,
  CreateCategoryInput,
  CreateCollectionInput,
  CreateSizeInput,
} from '@/schemas/create-catalogs.schema';

import { CatalogService } from '@/services/catalog.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const service = new CatalogService();

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBrandInput) => service.createAdminBrand(data),
    onSuccess: () => {
      // Invalidate and refetch products list (adjust query key as needed)
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => service.createAdminCategory(data),
    onSuccess: () => {
      // Invalidate and refetch products list (adjust query key as needed)
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCollectionInput) => service.createAdminCollection(data),
    onSuccess: () => {
      // Invalidate and refetch products list (adjust query key as needed)
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useCreateSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSizeInput) => service.createAdminSize(data),
    onSuccess: () => {
      // Invalidate and refetch products list (adjust query key as needed)
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
    },
  });
}
