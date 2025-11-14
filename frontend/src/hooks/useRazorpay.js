import { useState, useEffect } from 'react';

const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay SDK');
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const openCheckout = (options) => {
    if (!isLoaded || !window.Razorpay) {
      console.error('Razorpay SDK not loaded');
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return { isLoaded, openCheckout };
};

export default useRazorpay;
