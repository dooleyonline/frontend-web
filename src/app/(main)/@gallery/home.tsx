"use server";

import { CategoryGallery } from "@/components/category";
import { ItemGallery } from "@/components/item";
import SiteHeader from "@/components/site-header";
import Section, { SectionHeader } from "@/components/site-section";
import api from "@/lib/api";

const Home = async () => {
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
          <ItemGallery query={api.item.getMany({ page: 1 })} />
        </Section>

        <Section id="trending">
          <SectionHeader title="Trending" subtitle="Discover hot new items" />
          <ItemGallery query={api.item.getMany({ page: 2 })} />
        </Section>
      </main>
    </>
  );
};

export default Home;
