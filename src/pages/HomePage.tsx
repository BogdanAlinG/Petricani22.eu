import React from 'react';
import Hero from '../components/Hero';
import KeyFeatures from '../components/KeyFeatures';
import PhotoGallery from '../components/PhotoGallery';
import Amenities from '../components/Amenities';
import RentalOptions from '../components/RentalOptions';
import Location from '../components/Location';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import ContactForm from '../components/ContactForm';
import PropertyStickyNav from '../components/PropertyStickyNav';

const HomePage: React.FC = () => {
  return (
    <>
      <PropertyStickyNav />
      <Hero />
      <KeyFeatures />
      <PhotoGallery />
      <Amenities />
      <RentalOptions />
      <Location />
      <Testimonials />
      <FAQ />
      <ContactForm />
    </>
  );
};

export default HomePage;
