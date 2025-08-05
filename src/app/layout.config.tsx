import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import SolanaIcon from "./icon.svg";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image alt="" width={18} height={18} src={SolanaIcon} />
        Solana for Developers
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
