import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';

export default function LandingIndex() {
  return (
    <div className="bg-hero-bg min-h-screen">
      <Navbar />
      <HeroSection />
    </div>
  );
}
