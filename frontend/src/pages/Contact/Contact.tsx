import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';

const Contact: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState<string>('');
  useEffect(() => {
    setPrevLocation(location.state?.data || '');
  }, [location]);

  const [clientName, setClientName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [messages, setMessages] = useState<string>('');

  const [errClientName, setErrClientName] = useState<string>('');
  const [errEmail, setErrEmail] = useState<string>('');
  const [errMessages, setErrMessages] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientName(e.target.value);
    setErrClientName('');
  };
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrEmail('');
  };
  const handleMessages = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessages(e.target.value);
    setErrMessages('');
  };

  const EmailValidation = (email: string): boolean => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email);
  };

  const handlePost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let valid = true;

    if (!clientName) {
      setErrClientName('Enter your Name');
      valid = false;
    }
    if (!email) {
      setErrEmail('Enter your Email');
      valid = false;
    } else if (!EmailValidation(email)) {
      setErrEmail('Enter a Valid Email');
      valid = false;
    }
    if (!messages) {
      setErrMessages('Enter your Messages');
      valid = false;
    }

    if (valid) {
      setSuccessMsg(
        `Thank you dear ${clientName}, your message has been received successfully. Further details will be sent to your email at ${email}.`
      );
    }
  };

  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="Contact" prevLocation={prevLocation} />
      {successMsg ? (
        <p className="pb-20 w-96 font-medium text-green-500">{successMsg}</p>
      ) : (
        <form onSubmit={handlePost} className="pb-20">
          <h1 className="font-titleFont font-semibold text-3xl">
            Fill up a Form
          </h1>
          <div className="w-[500px] h-auto py-6 flex flex-col gap-6">
            <div>
              <p className="text-base font-titleFont font-semibold px-2">
                Name
              </p>
              <input
                onChange={handleName}
                value={clientName}
                className="w-full py-1 border-b-2 px-2 text-base font-medium placeholder:font-normal placeholder:text-sm outline-none focus-within:border-primeColor"
                type="text"
                placeholder="Enter your name here"
              />
              {errClientName && (
                <p className="text-red-500 text-sm font-titleFont font-semibold mt-1 px-2 flex items-center gap-1">
                  <span className="text-sm italic font-bold">!</span>
                  {errClientName}
                </p>
              )}
            </div>

            <div>
              <p className="text-base font-titleFont font-semibold px-2">
                Email
              </p>
              <input
                onChange={handleEmail}
                value={email}
                className="w-full py-1 border-b-2 px-2 text-base font-medium placeholder:font-normal placeholder:text-sm outline-none focus-within:border-primeColor"
                type="email"
                placeholder="Enter your email here"
              />
              {errEmail && (
                <p className="text-red-500 text-sm font-titleFont font-semibold  px-2 flex items-center gap-1">
                  <span className="text-sm italic font-bold">!</span>
                  {errEmail}
                </p>
              )}
            </div>

            <div>
              <p className="text-base font-titleFont font-semibold px-2">
                Messages
              </p>
              <textarea
                onChange={handleMessages}
                value={messages}
                cols={30}
                rows={3}
                className="w-full  border-b-2 px-2 text-base font-medium placeholder:font-normal placeholder:text-sm outline-none focus-within:border-primeColor resize-none"
                placeholder="Enter your message here"
              ></textarea>
              {errMessages && (
                <p className="text-red-500 text-sm font-titleFont font-semibold  px-2 flex items-center gap-1">
                  <span className="text-sm italic font-bold">!</span>
                  {errMessages}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-44 bg-primeColor text-gray-200 h-10 font-titleFont text-base tracking-wide font-semibold hover:bg-black hover:text-white duration-200"
            >
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Contact;
