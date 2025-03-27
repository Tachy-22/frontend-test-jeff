"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 dark:bg-gray-900/90 shadow-md backdrop-blur-sm' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold">
              DocEditor
            </Link>
          </div>

        

          {/* User Section */}
          {/* <div className="hidden md:flex items-center space-x-3">
            <Button >
              Sign In
            </Button>
            <Button className="px-4 py-2 text-sm font-medium text-white dark:text-gray-900 bg-indigo-600 dark:bg-indigo-400 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors">
              Sign Up
            </Button>
          </div> */}

          {/* Mobile menu button */}
          <div className="md:hidden flex">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg 
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 shadow-lg">
   
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
         
        </div>
      </div>
    </header>
  );
}

export default Navbar