(() => {
  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const header = document.querySelector("[data-header]");

  const updateMobileMenuOffset = () => {
    if (!header) return;
    const offset = header.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty("--mobile-header-height", `${Math.max(67, offset)}px`);
  };
  updateMobileMenuOffset();
  window.addEventListener("resize", updateMobileMenuOffset);
  document.fonts?.ready.then(updateMobileMenuOffset);

  const closeMenu = () => {
    body.classList.remove("menu-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileMenu?.setAttribute("aria-hidden", "true");
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = body.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    mobileMenu?.setAttribute("aria-hidden", String(!isOpen));
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeVideo();
    }
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  document.querySelectorAll("[data-faq-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      const list = button.closest(".faq-list");
      list?.querySelectorAll("[data-faq-button]").forEach((otherButton) => {
        otherButton.setAttribute("aria-expanded", "false");
      });
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  const categoryLinks = document.querySelectorAll("[data-category-link]");
  if (categoryLinks.length && "IntersectionObserver" in window) {
    const sections = [...categoryLinks]
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const categoryObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          categoryLinks.forEach((link) => {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        });
      },
      { rootMargin: "-28% 0px -60% 0px" }
    );
    sections.forEach((section) => categoryObserver.observe(section));
  }

  let lastFocusedElement = null;
  const videoModal = document.querySelector("[data-video-modal]");
  const video = videoModal?.querySelector("video");

  function openVideo() {
    if (!videoModal || !video) return;
    lastFocusedElement = document.activeElement;
    videoModal.classList.add("is-open");
    videoModal.setAttribute("aria-hidden", "false");
    body.classList.add("modal-open");
    video.play().catch(() => {});
    videoModal.querySelector("[data-modal-close]")?.focus();
  }

  function closeVideo() {
    if (!videoModal || !videoModal.classList.contains("is-open")) return;
    videoModal.classList.remove("is-open");
    videoModal.setAttribute("aria-hidden", "true");
    body.classList.remove("modal-open");
    video?.pause();
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }

  document.querySelectorAll("[data-video-open]").forEach((button) => {
    button.addEventListener("click", openVideo);
  });
  document.querySelector("[data-modal-close]")?.addEventListener("click", closeVideo);
  videoModal?.addEventListener("click", (event) => {
    if (event.target === videoModal) closeVideo();
  });

  const interestField = document.querySelector("#product-interest");
  if (interestField) {
    const params = new URLSearchParams(window.location.search);
    const requestedProduct = params.get("product");
    const allowed = [...interestField.options].map((option) => option.value);
    if (requestedProduct && allowed.includes(requestedProduct)) {
      interestField.value = requestedProduct;
    }
  }

  const inquiryForms = document.querySelectorAll("form[data-inquiry-form]");
  inquiryForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.reportValidity()) {
        event.preventDefault();
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending inquiry...";
      }
    });
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
})();
