import React from 'react';
import Banner from '../../components/Banner/Banner';
import BannerBottom from '../../components/Banner/BannerBootom';
import BestSellers from '../../components/Home/BestSellers/BestSellers';
import NewArrival from '../../components/Home/NewArrival/NewArrivals';
import Sale from '../../components/Home/Sale/Sale';
import SpecialOffers from '../../components/Home/SpecialOffer/SpecialOffer';
import YearProduct from '../../components/Home/YearProduct/YearProduct';

const Home: React.FC = () => {
  return (
    <div className="w-full mx-[10px]">
      <Banner />
      <BannerBottom />
      <div className="max-w-container mx-auto px-4">
        <Sale />
        <NewArrival />
        <BestSellers />
        <YearProduct />
        <SpecialOffers />
      </div>
    </div>
  );
};
export default Home;
