import React from 'react';
import { FaInstagram, FaTiktok, FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white py-6 mt-auto relative">
      <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
        {/* Centered attribution text */}
        <div className="text-center text-gray-600 w-full mb-4 md:mb-0">
          <p>
            made with ❤️ by{' '}
            <a
              href="https://bufferring.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              BufferRing
            </a>
          </p>
        </div>
        {/* Right-aligned social media icons */}
        <div className="flex justify-center space-x-4 text-gray-600 md:absolute md:right-4">
          <a
            href="https://www.instagram.com/carfixve"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition-colors"
            aria-label="Instagram"
          >
            <FaInstagram size={24} />
          </a>
          <a
            href="https://www.tiktok.com/@carfixve"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
            aria-label="TikTok"
          >
            <FaTiktok size={24} />
          </a>
          <a
            href="https://github.com/bufferring/carfix-mono"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition-colors"
            aria-label="GitHub"
          >
            <FaGithub size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;