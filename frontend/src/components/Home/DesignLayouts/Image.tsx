import React from 'react';
interface ImgProps {
  imgSrc: string;
  className: string;
  alt?: string;
}

const Image: React.FC<ImgProps> = ({ imgSrc, className, alt }) => {
  return <img className={className} src={imgSrc} alt={imgSrc || alt || ' '} />;
};
export default Image;
