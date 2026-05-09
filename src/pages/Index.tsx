import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StoryStrip } from "@/components/StoryStrip";
import { About } from "@/components/About";
import { MenuPreview } from "@/components/MenuPreview";
import { OrderBuilder } from "@/components/OrderBuilder";
import { Walkthrough3D } from "@/components/Walkthrough3D";
import { ReservationWidget } from "@/components/ReservationWidget";
import { FloorPlan } from "@/components/FloorPlan";
import { Feedback } from "@/components/Feedback";
import { Visit } from "@/components/Visit";
import { Footer } from "@/components/Footer";
import { StickyReserveBar } from "@/components/StickyReserveBar";
import { AmbientLayer } from "@/components/AmbientLayer";
import { useEffect } from "react";
import { refreshReservations } from "@/lib/reservations";

const Index = () => {
  useEffect(() => {
    document.title = "Mayrig — Armenian fine dining in Beirut · Reserve a table";
    const desc = "Reserve a table at Mayrig, a candlelit Armenian restaurant in Beirut. Heritage mezze, slow-grilled kebabs and pistachio baklava.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);
    let l = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!l) { l = document.createElement("link"); l.setAttribute("rel", "canonical"); document.head.appendChild(l); }
    l.setAttribute("href", window.location.origin + "/");
    refreshReservations();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <StoryStrip />
      <About />
      <MenuPreview />
      <OrderBuilder />
      <Gallery />
      <Walkthrough3D />
      <FloorPlan />
      <ReservationWidget />
      <Feedback />
      <Delivery />
      <Visit />
      <Footer />
      <StickyReserveBar />
      <AmbientLayer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            name: "Mayrig",
            servesCuisine: "Armenian",
            priceRange: "$$$",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Pasteur Street, Gemmayze",
              addressLocality: "Beirut",
              addressCountry: "LB",
            },
            acceptsReservations: true,
          }),
        }}
      />
    </main>
  );
};

export default Index;
