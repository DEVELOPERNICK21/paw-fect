import Image from "next/image";
import Link from "next/link";

import pawsoulLogo from "@/app/assets/brand/pawsoul-logo.png";

type BrandLogoProps = {
  /** Show the Pawsoul wordmark beside the icon. Default true. */
  showWordmark?: boolean;
  /** Icon edge length in pixels (CSS). Default 40. */
  size?: number;
  /** Link to home. Pass null to render without a link. Default "/". */
  href?: string | null;
  className?: string;
  /** Slightly bolder wordmark for marketing nav. */
  wordmarkClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  showWordmark = true,
  size = 40,
  href = "/",
  className = "",
  wordmarkClassName = "text-gradient-brand text-lg font-bold tracking-tight",
  priority = false,
}: BrandLogoProps): React.ReactElement {
  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={pawsoulLogo}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-[22%] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        style={{ width: size, height: size }}
        priority={priority}
      />
      {showWordmark ? <span className={wordmarkClassName}>Pawsoul</span> : null}
    </span>
  );

  if (!href) {
    return (
      <span className="inline-flex" aria-label="Pawsoul">
        {mark}
      </span>
    );
  }

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Pawsoul home">
      {mark}
    </Link>
  );
}
