import { CreateProductInput } from '@/schemas/create-product.schema';
import { ProductService } from '@/services/product.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const service = new ProductService();

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => service.createAdminProduct(data),
    onSuccess: () => {
      // Invalidate and refetch products list (adjust query key as needed)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
