import React from 'react';
interface FootProps {
  title: string;
}
const FooterListStyle: React.FC<FootProps> = ({ title }) => {
  return <h3 className="text_xl font-bodyFont font-semibold mb-6">{title}</h3>;
};
export default FooterListStyle;
