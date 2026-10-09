import Image from "next/image";
import styles from "./SocialLink.module.css";

type SocialPlatform = "whatsapp" | "instagram" | "maps";

const originalIcons: Record<SocialPlatform, string> = {
  whatsapp: "/images/brands/whatsapp-original.svg",
  instagram: "/images/brands/instagram-original.png",
  maps: "/images/brands/google-maps-original.png",
};

export function SocialIcon({ platform }: { platform: SocialPlatform }): React.JSX.Element {
  return (
    <Image
      className={styles.icon}
      src={originalIcons[platform]}
      width={32}
      height={32}
      alt=""
      aria-hidden="true"
    />
  );
}

export default function SocialLink({ platform, href, label, className }: {
  platform: SocialPlatform;
  href: string;
  label: string;
  className?: string;
}): React.JSX.Element {
  return (
    <a data-brand-link={platform} className={[styles.link, className].filter(Boolean).join(" ")} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
      <SocialIcon platform={platform} />
    </a>
  );
}
