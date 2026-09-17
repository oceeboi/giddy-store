import { ClothingProductData } from '@/types/shared/product';

type ProductCardProps = {
  data: ClothingProductData;
};

export function ProductCard({ data }: ProductCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-none bg-transparent text-black transition-all duration-200 ease-in-out hover:border-neutral-400">
      <div className="bg-amber-200 min-h-[208px] h-full " />
      <div>
        <div>product Card{data.brand?.name}</div>
      </div>
    </article>
  );
}
