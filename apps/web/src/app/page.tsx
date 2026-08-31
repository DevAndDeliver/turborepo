import { Navbar } from "@/components/nav/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Features } from "@/components/features/Features";
import { TechStack } from "@/components/stack/TechStack";
import { Articles } from "@/components/articles/Articles";
import { WaitlistForm } from "@/components/contact/WaitlistForm";
import { Contact } from "@/components/contact/Contact";
import { Footer } from "@/components/footer/Footer";
import { fetchHero, fetchFeatures, fetchArticles } from "@/lib/contentful";

export default async function Home() {
  const [hero, features, articles] = await Promise.all([
    fetchHero(),
    fetchFeatures(),
    fetchArticles(),
  ]);

  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero headline={hero.headline} subline={hero.subline} />
      <Features items={features} />
      <TechStack />
      <Articles articles={articles} />
      <WaitlistForm />
      <Contact />
      <Footer />
    </main>
  );
}
