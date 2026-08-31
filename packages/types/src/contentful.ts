export interface HeroContent {
  headline: string;
  subline: string;
  ctaLabel: string;
}

export interface FeatureContent {
  title: string;
  description: string;
  order: number;
}

export interface ArticleTeaserContent {
  number: string;
  title: string;
  excerpt: string;
  href: string;
  published: boolean;
  order: number;
}
