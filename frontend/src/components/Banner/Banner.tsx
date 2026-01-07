// src/components/home/Banner.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Slider, { Settings } from 'react-slick';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setDotActive } from '../../redux/bannerSlice';
import {
  bannerImgOne,
  bannerImgTwo,
  bannerImgThree,
} from '../../assets/images';
import Image from '../Home/DesignLayouts/Image';

const Banner: React.FC = () => {
  const dispatch = useDispatch();
  const dotActive = useSelector((state: RootState) => state.banner.dotActive);

  const settings: Settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    beforeChange: (prev: number, next: number) => {
      dispatch(setDotActive(next));
    },
    customPaging: (i: number) => (
      <div
        style={
          i === dotActive
            ? {
                width: '50px',
                height: '30px',
                color: '#262626',
                borderRight: '3px #262626 solid',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: '20px',
                paddingRight: '8px',
                display: 'flex',
                alignItems: 'center',
              }
            : {
                width: '50px',
                height: '30px',
                color: 'transparent',
                borderRight: '3px white solid',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: '20px',
                paddingRight: '8px',
                display: 'flex',
                alignItems: 'center',
              }
        }
      >
        0{i + 1}
      </div>
    ),
    responsive: [
      {
        breakpoint: 576,
        settings: {
          dots: true,
          customPaging: (i: number) => (
            <div
              style={
                i === dotActive
                  ? {
                      width: '25px',
                      height: '18px',
                      color: '#262626',
                      borderRight: '3px #262626 solid',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '18px',
                      paddingRight: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }
                  : {
                      width: '25px',
                      height: '18px',
                      color: 'transparent',
                      borderRight: '3px white solid',
                      cursor: 'pointer',
                      fontSize: '12px',
                      lineHeight: '18px',
                      paddingRight: '6px',
                      display: 'flex',
                      alignItems: 'center',
                    }
              }
            >
              0{i + 1}
            </div>
          ),
        },
      },
    ],
  };

  return (
    <div className="w-full bg-white ">
      <Slider {...settings} className="relative">
        <Link to="/offer">
          <Image
            imgSrc={bannerImgOne}
            className="relative w-full  object-cover"
          />
        </Link>
        <Link to="/offer">
          <Image
            imgSrc={bannerImgTwo}
            className="relative w-full  object-cover"
          />
        </Link>
        <Link to="/offer">
          <Image
            imgSrc={bannerImgThree}
            className="relative w-full  object-cover"
          />
        </Link>
      </Slider>
    </div>
  );
};

export default Banner;
