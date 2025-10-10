"use client";

import { CategoryGallery } from "@/components/category";
import ItemGallery from "@/components/item/item-gallery";
import SiteHeader from "@/components/site-header";
import Section, { SectionHeader } from "@/components/site-section";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const categoryRes = useQuery(api.category.getAll());

  // TODO: replace these with actual for-you and trending data
  const forYouRes = useQuery(api.item.getMany());
  const trendingRes = useQuery(api.item.getMany());

  return (
    <>
      <SiteHeader isExpanded />
      <main>
        <Section id="categories">
          <CategoryGallery {...categoryRes} />
        </Section>

        <Section id="for-you">
          <SectionHeader
            title="For You"
            subtitle="Picked based on your recent search. Updated daily."
          />
          <ItemGallery {...forYouRes} />
        </Section>

        <Section id="trending">
          <SectionHeader title="Trending" subtitle="Discover hot new items" />
          <ItemGallery {...trendingRes} />
        </Section>
      </main>
    </>
  );
};

export default Home;
