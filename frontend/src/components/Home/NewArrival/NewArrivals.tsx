import React from 'react';
import Slider, { Settings } from 'react-slick';
import Heading from '../Product/Heading';
import Product from '../Product/Product';
import {
  newArrOne,
  newArrTwo,
  newArrThree,
  newArrFour,
} from '../../../assets/images';
import SampleNextArrow from './SampleNextArrow';
import SamplePrevArrow from './SamplePrevArrow';
import { RootState } from '../../../redux/store';
import { useSelector } from 'react-redux';

const NewArrival: React.FC = () => {
  const products = useSelector(
    (state: RootState) => state.orebiReducer.products
  );

  const settings: Settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
    ],
  };

  return (
    <div className="w-full pb-16">
      <Heading heading="New Arrivals" />
      <div className="slider-container">
        <Slider {...settings}>
          <div className="px-1 sm:px-2">
            <Product
              _id="100001"
              img={newArrOne}
              productName="Round Table Clock"
              price="44.00"
              color="Black"
              badge={true}
              des="Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic excepturi quibusdam odio deleniti reprehenderit facilis."
            />
          </div>
          <div className="px-1 sm:px-2">
            <Product
              _id="100002"
              img={newArrTwo}
              productName="Smart Watch"
              price="250.00"
              color="Black"
              badge={true}
              des="Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic excepturi quibusdam odio deleniti reprehenderit facilis."
            />
          </div>
          <div className="px-1 sm:px-2">
            <Product
              _id="100003"
              img={newArrThree}
              productName="Cloth Basket"
              price="80.00"
              color="Mixed"
              badge={true}
              des="Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic excepturi quibusdam odio deleniti reprehenderit facilis."
            />
          </div>
          <div className="px-1 sm:px-2">
            <Product
              _id="100004"
              img={newArrFour}
              productName="Funny toys for babies"
              price="60.00"
              color="Mixed"
              badge={false}
              des="Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic excepturi quibusdam odio deleniti reprehenderit facilis."
            />
          </div>
          <div className="px-1 sm:px-2">
            <Product
              _id="100005"
              img={newArrTwo}
              productName="Smart Watch Pro"
              price="299.00"
              color="Silver"
              badge={true}
              des="Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic excepturi quibusdam odio deleniti reprehenderit facilis."
            />
          </div>
        </Slider>
      </div>
    </div>
  );
};

export default NewArrival;
