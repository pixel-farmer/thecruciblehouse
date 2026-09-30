/**
 * Brand settings for this template.
 * Change the values here, and replace the logo files in /public.
 * The browser tab icon is app/icon.png. Next.js loads that file on its own.
 *
 * Hero scene options: "off", "orbs", "waves", "grid".
 * "off" keeps Three.js out of the initial page load.
 * To add your own, create a scene component, register it in
 * app/components/hero/HeroBackdrop.tsx, then set hero.scene to its name.
 */
export const heroSceneIds = ["off", "orbs", "waves", "grid"] as const;
export type HeroSceneId = (typeof heroSceneIds)[number];

export const siteConfig = {
  name: "Site Name",
  tagline: "Site Tagline",
  description: "Site Description",
  logo: {
    header: "/logo-dark.svg",
    footer: "/logo-light.svg",
    alt: "Site Name",
  },
  contactEmail: "youremail@gmail.com",
  social: {
    instagram: "https://www.instagram.com/instagramhandle/",
  },
  hero: {
    title: "A home for your community",
    subtitle: "Share work, find opportunities, and bring people together.",
    ctaLabel: "View Artists",
    ctaHref: "/artist",
    scene: "off" as HeroSceneId,
  },
};
