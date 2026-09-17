interface HeaderProps {
  productName: string;
  description?: string;
}

export const HeroHeader = ({
  productName,
  description = 'Explore Ashluxe men’s clothing, from everyday essentials to elevated streetwear designed for a confident, contemporary look. Discover premium pieces from the leading Nigerian streetwear brand.',
}: HeaderProps) => {
  return (
    <header className="flex w-full flex-col items-start justify-start gap-2.5">
      <h1 className="font-archivo-black text-[#821E2A] text-2xl uppercase tracking-tight  md:text-4xl lg:text-[44px] lg:leading-tight">
        {productName}
      </h1>

      <p className="max-w-3xl font-archivo text-xs leading-relaxed text-[#767676] md:text-sm">
        {description}
      </p>
    </header>
  );
};
