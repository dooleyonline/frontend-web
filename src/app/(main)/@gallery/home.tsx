"use client";

import { CategoryGallery } from "@/components/category";
import { ItemGallery } from "@/components/item";
import SiteHeader from "@/components/site-header";
import Section, { SectionHeader } from "@/components/site-section";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const forYou = useQuery(api.item.getMany({ page: 1 }));
  const trending = useQuery(api.item.getMany({ page: 2 }));

  return (
    <>
      <SiteHeader isExpanded />
      <main>
        <Section id="categories">
          <CategoryGallery />
        </Section>

        <Section id="for-you">
          <SectionHeader
            title="For You"
            subtitle="Picked based on your recent search. Updated daily."
          />
          <ItemGallery {...forYou} />
        </Section>

        <Section id="trending">
          <SectionHeader title="Trending" subtitle="Discover hot new items" />
          <ItemGallery {...trending} />
        </Section>
      </main>
    </>
  );
};

export default Home;
