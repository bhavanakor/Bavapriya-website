"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/componenets/CartProvider";

const navItems = [
  { label: "Home", href: "/#home", id: "home" },
  { label: "About", href: "/#aboutUs", id: "aboutUs" },
  { label: "Products", href: "/#products", id: "products" },
  { label: "Ritual Finder", href: "/ritual-finder", id: "ritual-finder" },
  { label: "Reviews", href: "/#reviews", id: "reviews" },
  { label: "FAQ", href: "/#faq", id: "faq" },
  { label: "Contact", href: "/#contact", id: "contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeout = useRef<number | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { count } = useCart();

  useEffect(() => {
    if (!isHome) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      setIsVisible(true);
      if (hideTimeout.current !== null) {
        window.clearTimeout(hideTimeout.current);
      }

      if (window.scrollY <= 120) {
        hideTimeout.current = null;
        return;
      }

      hideTimeout.current = window.setTimeout(() => {
        setIsVisible(false);
        hideTimeout.current = null;
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimeout.current !== null) {
        window.clearTimeout(hideTimeout.current);
      }
    };
  }, [isHome]);

  const handleNav = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: (typeof navItems)[number]
  ) => {
    if (pathname === "/" && item.href.startsWith("/#")) {
      event.preventDefault();
      const el = document.getElementById(item.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", item.href);
      }
    }
    setIsOpen(false);
  };

  return (
    <nav
      className={`${
        isHome ? "fixed" : "sticky"
      } inset-x-0 top-0 z-50 rounded-b-2xl bg-[#F7F5EF]/95 text-[#3A4F41] shadow-sm backdrop-blur-md transition-[opacity,transform] duration-500 ease-in-out`}
      style={{
        opacity: !isHome || isVisible ? 1 : 0,
        transform: !isHome || isVisible ? "translateY(0)" : "translateY(-100%)",
        pointerEvents: !isHome || isVisible ? "auto" : "none",
      }}
    >
      <div className="flex w-full items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
        <Link href="/#home" className="flex shrink-0 items-center" aria-label="Bavapriya Facials home">
          <Image
            src="/logo.jpeg"
            alt="Bavapriya Facials"
            width={56}
            height={56}
            priority
            className="h-12 w-12 rounded-full object-cover"
          />
        </Link>

        <div
          className={`${
            isOpen
              ? "absolute right-0 top-full flex w-56 flex-col gap-5 rounded-b-2xl bg-[#F7F5EF] px-6 py-6 shadow-md"
              : "hidden"
          } md:static md:flex md:w-auto md:flex-row md:items-center md:gap-6 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={(event) => handleNav(event, item)}
              className="relative text-sm font-medium text-[#3A4F41] transition-colors hover:text-[#8BA888]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link href="/cart" className="relative p-2" aria-label={`Cart${count ? `, ${count} items` : ""}`}>
            <ShoppingCartIcon className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3A4F41] px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex h-6 w-7 flex-col justify-between md:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <span className={`h-0.5 rounded bg-[#3A4F41] transition-transform ${isOpen ? "translate-y-2.5 rotate-[-45deg]" : ""}`} />
            <span className={`h-0.5 rounded bg-[#3A4F41] transition-opacity ${isOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 rounded bg-[#3A4F41] transition-transform ${isOpen ? "-translate-y-2.5 rotate-[45deg]" : ""}`} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
