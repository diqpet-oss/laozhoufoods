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

  const inquiryForms = document.querySelectorAll("[data-inquiry-form]");
  const inquiryTranslations = {
    en: {
      sending: "Sending inquiry...",
      success: "Thank you. Your inquiry has reached LaoZhou Foods.",
      successNote: "We usually respond within two business days.",
      invalid: "Please review the highlighted fields.",
      unavailable: "The form is temporarily unavailable. Your message has not been sent.",
      fallback: "Please email laozhoufood@gmail.com or contact us on WhatsApp so your inquiry is not lost.",
      network: "The connection failed. Your message has not been sent. Please try again.",
      email: "Email us",
      whatsapp: "WhatsApp",
    },
    zh: {
      sending: "正在发送…",
      success: "感谢您，您的询盘已送达老周食品。",
      successNote: "我们通常会在两个工作日内回复。",
      invalid: "请检查标记出的必填信息。",
      unavailable: "表单暂时无法使用，您的信息尚未发送。",
      fallback: "请通过 laozhoufood@gmail.com 或 WhatsApp 联系我们，以免询盘丢失。",
      network: "网络连接失败，您的信息尚未发送，请重试。",
      email: "发送邮件",
      whatsapp: "WhatsApp",
    },
    es: {
      sending: "Enviando consulta…",
      success: "Gracias. Su consulta llegó a LaoZhou Foods.",
      successNote: "Normalmente respondemos en un plazo de dos días hábiles.",
      invalid: "Revise los campos marcados.",
      unavailable: "El formulario no está disponible temporalmente. Su mensaje no se ha enviado.",
      fallback: "Escriba a laozhoufood@gmail.com o contáctenos por WhatsApp para que no se pierda su consulta.",
      network: "No se pudo conectar. Su mensaje no se ha enviado. Inténtelo de nuevo.",
      email: "Enviar correo",
      whatsapp: "WhatsApp",
    },
    fr: {
      sending: "Envoi de la demande…",
      success: "Merci. Votre demande a bien été reçue par LaoZhou Foods.",
      successNote: "Nous répondons généralement sous deux jours ouvrés.",
      invalid: "Veuillez vérifier les champs signalés.",
      unavailable: "Le formulaire est momentanément indisponible. Votre message n’a pas été envoyé.",
      fallback: "Écrivez à laozhoufood@gmail.com ou contactez-nous sur WhatsApp afin de ne pas perdre votre demande.",
      network: "La connexion a échoué. Votre message n’a pas été envoyé. Veuillez réessayer.",
      email: "Nous écrire",
      whatsapp: "WhatsApp",
    },
    de: {
      sending: "Anfrage wird gesendet…",
      success: "Vielen Dank. Ihre Anfrage ist bei LaoZhou Foods eingegangen.",
      successNote: "Wir antworten in der Regel innerhalb von zwei Werktagen.",
      invalid: "Bitte prüfen Sie die markierten Felder.",
      unavailable: "Das Formular ist vorübergehend nicht verfügbar. Ihre Nachricht wurde nicht gesendet.",
      fallback: "Bitte schreiben Sie an laozhoufood@gmail.com oder kontaktieren Sie uns über WhatsApp, damit Ihre Anfrage nicht verloren geht.",
      network: "Die Verbindung ist fehlgeschlagen. Ihre Nachricht wurde nicht gesendet. Bitte versuchen Sie es erneut.",
      email: "E-Mail senden",
      whatsapp: "WhatsApp",
    },
    pt: {
      sending: "Enviando consulta…",
      success: "Obrigado. A sua consulta chegou à LaoZhou Foods.",
      successNote: "Normalmente respondemos em até dois dias úteis.",
      invalid: "Verifique os campos assinalados.",
      unavailable: "O formulário está temporariamente indisponível. A sua mensagem não foi enviada.",
      fallback: "Escreva para laozhoufood@gmail.com ou contacte-nos pelo WhatsApp para que a sua consulta não se perca.",
      network: "A ligação falhou. A sua mensagem não foi enviada. Tente novamente.",
      email: "Enviar e-mail",
      whatsapp: "WhatsApp",
    },
    ja: {
      sending: "お問い合わせを送信中…",
      success: "ありがとうございます。お問い合わせはLaoZhou Foodsに届きました。",
      successNote: "通常、2営業日以内にご返信します。",
      invalid: "強調表示された項目をご確認ください。",
      unavailable: "フォームは一時的にご利用いただけません。メッセージはまだ送信されていません。",
      fallback: "お問い合わせを失わないよう、laozhoufood@gmail.com またはWhatsAppでご連絡ください。",
      network: "接続に失敗しました。メッセージは送信されていません。もう一度お試しください。",
      email: "メールを送る",
      whatsapp: "WhatsApp",
    },
    ko: {
      sending: "문의를 전송하는 중…",
      success: "감사합니다. 문의가 LaoZhou Foods에 전달되었습니다.",
      successNote: "보통 영업일 기준 2일 이내에 답변드립니다.",
      invalid: "표시된 필드를 확인해 주세요.",
      unavailable: "현재 양식을 사용할 수 없습니다. 메시지가 전송되지 않았습니다.",
      fallback: "문의가 유실되지 않도록 laozhoufood@gmail.com 또는 WhatsApp으로 연락해 주세요.",
      network: "연결에 실패했습니다. 메시지가 전송되지 않았습니다. 다시 시도해 주세요.",
      email: "이메일 보내기",
      whatsapp: "WhatsApp",
    },
    ar: {
      sending: "جارٍ إرسال الاستفسار…",
      success: "شكرًا لك. وصل استفسارك إلى LaoZhou Foods.",
      successNote: "نرد عادةً خلال يومَي عمل.",
      invalid: "يرجى مراجعة الحقول المحددة.",
      unavailable: "النموذج غير متاح مؤقتًا. لم يتم إرسال رسالتك.",
      fallback: "يرجى مراسلتنا على laozhoufood@gmail.com أو عبر WhatsApp حتى لا يضيع استفسارك.",
      network: "تعذر الاتصال. لم يتم إرسال رسالتك. يرجى المحاولة مرة أخرى.",
      email: "مراسلتنا",
      whatsapp: "WhatsApp",
    },
  };
  const languageKey = (document.documentElement.lang || "en").toLowerCase().split("-")[0];
  const inquiryCopy = inquiryTranslations[languageKey] || inquiryTranslations.en;

  function getStatusRegion(form) {
    let status = form.querySelector("[data-form-status]");
    if (!status) {
      status = document.createElement("div");
      status.dataset.formStatus = "";
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-atomic", "true");
      form.querySelector(".form-footer")?.before(status);
    }
    return status;
  }

  function resetFormStatus(form) {
    const status = getStatusRegion(form);
    status.className = "form-status";
    status.replaceChildren();
    status.removeAttribute("tabindex");
    form
      .querySelectorAll("[aria-invalid='true']")
      .forEach((field) => field.removeAttribute("aria-invalid"));
  }

  function buildMailtoFallback(form) {
    const data = buildPayload(form);
    const formLabel =
      data["form-name"] === "trade-inquiry"
        ? "Wholesale / trade inquiry"
        : "Website contact inquiry";
    const subject = `${formLabel} — ${data.company || data.name || "Website visitor"}`;
    const lines = [
      formLabel,
      "",
      `Name: ${data.name || ""}`,
      `Company: ${data.company || ""}`,
      `Email: ${data.email || ""}`,
      `Phone / WhatsApp: ${data.phone || ""}`,
      `Country / market: ${data.country || ""}`,
      `Business type: ${data.channel || ""}`,
      `Product interest: ${data["product-interests"] || ""}`,
      "",
      "Message:",
      data.message || "",
      "",
      `Page: ${data["page-url"] || ""}`,
      `Language: ${data["page-language"] || ""}`,
    ];
    return {
      href: `mailto:laozhoufood@gmail.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(lines.join("\n"))}`,
    };
  }

  function showFormStatus(form, type, message, fallback = false) {
    const status = getStatusRegion(form);
    status.className = `form-status form-status--${type}`;
    status.replaceChildren();

    const text = document.createElement("p");
    text.textContent = message;
    status.append(text);

    if (fallback) {
      const note = document.createElement("p");
      note.textContent = inquiryCopy.fallback;
      status.append(note);

      const links = document.createElement("div");
      links.className = "form-status__actions";

      const email = document.createElement("a");
      email.className = "btn btn--outline";
      email.href = buildMailtoFallback(form).href;
      email.textContent = inquiryCopy.email;

      const whatsapp = document.createElement("a");
      whatsapp.className = "btn btn--outline";
      whatsapp.href = "https://wa.me/8618068889836";
      whatsapp.target = "_blank";
      whatsapp.rel = "noopener";
      whatsapp.textContent = inquiryCopy.whatsapp;

      links.append(email, whatsapp);
      status.append(links);
    }

    status.setAttribute("tabindex", "-1");
    status.focus({ preventScroll: true });
    status.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function buildPayload(form) {
    const payload = {};
    new FormData(form).forEach((value, key) => {
      if (typeof value === "string") payload[key] = value;
    });
    payload["page-url"] = window.location.href;
    payload["page-language"] = document.documentElement.lang || "en";
    payload["page-context"] = window.location.pathname;
    return payload;
  }

  inquiryForms.forEach((form) => {
    if (!(form instanceof HTMLFormElement)) return;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonHtml = submitButton?.innerHTML ?? "";
    let submitting = false;

    form.addEventListener("input", () => {
      const field = document.activeElement;
      if (field instanceof HTMLElement) field.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;

      resetFormStatus(form);
      if (!form.reportValidity()) {
        showFormStatus(form, "error", inquiryCopy.invalid);
        return;
      }

      submitting = true;
      form.setAttribute("aria-busy", "true");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = inquiryCopy.sending;
      }

      try {
        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload(form)),
        });
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
          form.reset();
          showFormStatus(
            form,
            "success",
            `${inquiryCopy.success} ${inquiryCopy.successNote}`
          );
          return;
        }

        if (result.fields) {
          Object.keys(result.fields).forEach((name) => {
            const field = form.elements.namedItem(name);
            if (field instanceof HTMLElement) field.setAttribute("aria-invalid", "true");
          });
        }

        if (response.status === 422) {
          showFormStatus(form, "error", inquiryCopy.invalid);
        } else if (response.status === 503) {
          showFormStatus(form, "warning", inquiryCopy.unavailable, true);
        } else {
          showFormStatus(form, "error", inquiryCopy.network, true);
        }
      } catch {
        showFormStatus(form, "error", inquiryCopy.network, true);
      } finally {
        submitting = false;
        form.removeAttribute("aria-busy");
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonHtml;
        }
      }
    });
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
})();
