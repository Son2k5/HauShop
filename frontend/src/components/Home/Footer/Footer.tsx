import React, { ChangeEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import FooterListStyle from './FooterListStyle';
import { paymentCard } from '../../../assets/images';
import Image from '../DesignLayouts/Image';

const Footer: React.FC = () => {
  const [emailInfo, setEmailInfo] = useState<string>('');
  const [subscribe, setSubscribe] = useState<boolean>(false);
  const [errMes, setErrMes] = useState<string>('');

  const emailValidation = (emailInfo: string) => {
    return String(emailInfo)
      .toLowerCase()
      .match(/^\w+([-]?\w+)*@\w+([-]?\w+)*(\.\w{2,3})+$/);
  };

  const handleSubscription = () => {
    if (emailInfo === '') setErrMes('Please enter your Email !');
    else if (!emailValidation(emailInfo.trim()))
      setErrMes('Please give a valid Email');
    else {
      setSubscribe(true);
      setErrMes('');
      setEmailInfo('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmailInfo(e.target.value);
  };

  return (
    <div className="w-full bg-[#F5F5f3] py-20">
      <div className="max-w-container mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 px-4 gap-10">

        {/* About */}
        <div className="col-span-2">
          <FooterListStyle title="More About Orebi Shop" />
          <div className="flex flex-col gap-6">
            <p className="text-base w-full xl:w-[80%]">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Voluptates fugiat iste hic quod perspiciatis maiores doloribus
              tenetur quo aliquam dicta similique cum harum sit sequi deleniti
              est quibusdam, dolorem nobis!
            </p>

            <ul className="flex items-center gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <li className="w-7 h-7 bg-primeColor text-gray-200 hover:text-white rounded-full flex justify-center items-center hover:bg-black duration-300">
                  <Icon icon="mdi:facebook" className="text-lg" />
                </li>
              </a>

              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <li className="w-7 h-7 bg-primeColor text-gray-200 hover:text-white rounded-full flex justify-center items-center hover:bg-black duration-300">
                  <Icon icon="mdi:youtube" className="text-lg" />
                </li>
              </a>

              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <li className="w-7 h-7 bg-primeColor text-gray-200 hover:text-white rounded-full flex justify-center items-center hover:bg-black duration-300">
                  <Icon icon="mdi:github" className="text-lg" />
                </li>
              </a>

              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <li className="w-7 h-7 bg-primeColor text-gray-200 hover:text-white rounded-full flex justify-center items-center hover:bg-black duration-300">
                  <Icon icon="mdi:linkedin" className="text-lg" />
                </li>
              </a>
            </ul>
          </div>
        </div>

        {/* Shop */}
        <div>
          <ul className="flex flex-col gap-2">
            <FooterListStyle title="Shop" />
            {['Accessories', 'Clothes', 'Electronics', 'Home Appliances', 'New Arrival'].map(
              (item) => (
                <li
                  key={item}
                  className="font-semibold text-base text-lightText hover:text-black hover:underline underline-offset-2 duration-300 cursor-pointer"
                >
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        {/* Account */}
        <div>
          <ul className="flex flex-col gap-2">
            <FooterListStyle title="Account" />
            {['Profile', 'Orders', 'Address', 'Account detail', 'Payment Options'].map(
              (item) => (
                <li
                  key={item}
                  className="font-semibold text-base text-lightText hover:text-black hover:underline underline-offset-2 duration-300 cursor-pointer"
                >
                  {item}
                </li>
              )
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="flex flex-col items-center col-span-2 px-4">
          <FooterListStyle title="Subscribe to our newsletter" />
          <p className="text-center mb-4">
            A at pellentesque et mattis porta enim elementum.
          </p>

          {subscribe ? (
            <motion.p
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-green-600 font-semibold"
            >
              Subscribed Successfully !
            </motion.p>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <input
                type="email"
                value={emailInfo}
                onChange={handleInputChange}
                placeholder="Enter your email ..."
                className="w-full h-12 border-b border-gray-400 bg-transparent px-4 text-primeColor outline-none"
              />

              {errMes && (
                <p className="text-red-500 text-sm font-semibold animate-bounce">
                  {errMes}
                </p>
              )}

              <button
                onClick={handleSubscription}
                className="bg-white text-lightText w-[30%] h-10 hover:bg-black hover:text-white duration-300"
              >
                Subscribe
              </button>
            </div>
          )}

          <Image
            className={`w-[80%] lg:w-[60%] mx-auto ${subscribe ? 'mt-2' : 'mt-6'}`}
            imgSrc={paymentCard}
          />
        </div>
      </div>
    </div>
  );
};

export default Footer;
