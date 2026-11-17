"use client"
import { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

const ContactPage = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(formRef, { once: true, amount: 0.5 });
  const [formData, setFormData] = useState({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const [isSubmitting, setIsSubmitting] = useState(false);
const [formStatus, setFormStatus] = useState("");

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setFormData((previous) => ({
    ...previous,
    [name]: value,
  }));
};

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setIsSubmitting(true);
  setFormStatus("");

  try {
    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      throw new Error("Google Apps Script URL is not configured.");
    }

    await fetch(scriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "enquiry",
        ...formData,
      }),
    });

    setFormStatus(
      "Submission request sent. Please verify that it appears in Google Sheets."
    );

  } catch (error) {
    console.error("Form submission error:", error);
    setFormStatus(
      "Unable to send your message. Please try again."
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  const formVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        delay: 0.3
      }
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden">
      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section */}
        <motion.div
          className="relative bg-amber-900 rounded-b-2xl overflow-hidden mb-12 h-64 md:h-80 flex items-center justify-center text-center"
          style={{
            backgroundImage: "linear-gradient(rgba(93, 64, 55, 0.8), rgba(61, 39, 35, 0.8)), url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative z-10 px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-md">
              Connect With Us
            </h1>
            <p className="text-amber-100 text-lg md:text-xl max-w-2xl mx-auto">
              We'd love to hear from you! Reach out for inquiries, feedback, or just to say hello.
            </p>
          </div>
          <div className="absolute inset-0 bg-amber-900/70"></div>
        </motion.div>

        {/* Contact Container */}
        <div className="flex flex-col lg:flex-row gap-8 mb-16">
          {/* Contact Info Cards */}
          <motion.div 
            className="flex-1 space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-700">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Email Us</h3>
              <a className="block text-gray-600 hover:text-amber-800" href="mailto:vidyabavana@gmail.com">
                vidyabavana@gmail.com
              </a>
              <a className="block text-gray-600 hover:text-amber-800" href="mailto:bhavanakor764@gmail.com">
                bhavanakor764@gmail.com
              </a>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-700">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Call Us</h3>
              <a className="block text-gray-600 hover:text-amber-800" href="tel:+919677165794">
                +91 96771 65794
              </a>
              <a className="block text-gray-600 hover:text-amber-800" href="tel:+919043891268">
                +91 90438 91268
              </a>
            </motion.div>

            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-700">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-amber-900 mb-3">Visit Us</h3>
              <a
                className="block text-gray-600 hover:text-amber-800"
                href="https://www.google.com/maps/search/?api=1&query=6%2F13+Chinthal+Amman+Koil+Street%2C+Pammal"
                target="_blank"
                rel="noopener noreferrer"
              >
                6/13 Chinthal Amman Koil Street, Pammal
              </a>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            className="flex-1 bg-white p-6 md:p-8 rounded-xl shadow-md relative"
            ref={formRef}
            variants={formVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

  {/* Customer Name */}
  <div className="space-y-2">
    <label htmlFor="name" className="block font-medium text-amber-800">
      Your Name
    </label>
    <input
      type="text"
      id="name"
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Enter your name"
      required
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
    />
  </div>

  {/* Email */}
  <div className="space-y-2">
    <label htmlFor="email" className="block font-medium text-amber-800">
      Email Address
    </label>
    <input
      type="email"
      id="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder="Enter your email"
      required
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
    />
  </div>

  {/* Phone */}
  <div className="space-y-2">
    <label htmlFor="phone" className="block font-medium text-amber-800">
      Phone Number
    </label>
    <input
      type="tel"
      id="phone"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      placeholder="Enter your phone number"
      pattern="[0-9+() -]{7,20}"
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
    />
  </div>

  {/* Subject */}
  <div className="space-y-2">
    <label htmlFor="subject" className="block font-medium text-amber-800">
      Subject
    </label>
    <input
      type="text"
      id="subject"
      name="subject"
      value={formData.subject}
      onChange={handleChange}
      placeholder="What's this about?"
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
    />
  </div>

  {/* Message */}
  <div className="space-y-2">
    <label htmlFor="message" className="block font-medium text-amber-800">
      Your Message
    </label>
    <textarea
      id="message"
      name="message"
      rows={5}
      value={formData.message}
      onChange={handleChange}
      placeholder="Type your message here..."
      required
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
    />
  </div>

  {/* Status */}
  {formStatus && (
    <p role="status" aria-live="polite" className="text-sm text-amber-800">
      {formStatus}
    </p>
  )}

  {/* Submit */}
  <motion.button
    type="submit"
    disabled={isSubmitting}
    className="w-full bg-amber-700 text-white py-3 px-6 rounded-full font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
  >
    {isSubmitting ? "Sending..." : "Send Message"}
  </motion.button>

</form>

            {/* Decorative elements */}
            <div className="absolute -top-8 -left-8 w-24 h-24 opacity-10 -z-10">
              <img 
                src="https://www.transparentpng.com/thumb/leaf/tea-leaf-transparent-background-9.png" 
                alt="leaf decoration"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 opacity-10 -z-10 rotate-15">
              <img 
                src="https://www.transparentpng.com/thumb/leaf/leaf-transparent-background-12.png" 
                alt="leaf decoration"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div 
          className="h-96 w-full rounded-xl overflow-hidden shadow-lg mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <iframe 
            src="https://www.google.com/maps?q=6%2F13%20Chinthal%20Amman%20Koil%20Street%2C%20Pammal&output=embed"
            allowFullScreen
            loading="lazy"
            title="Our Location"
            className="w-full h-full"
          ></iframe>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ContactPage;