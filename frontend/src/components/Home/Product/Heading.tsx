import React from 'react';

interface HeadingProps {
  heading: string;
}

const Heading: React.FC<HeadingProps> = ({ heading }) => {
  return <div className="text-3xl font-semibold pb-6">{heading}</div>;
};
export default Heading;
