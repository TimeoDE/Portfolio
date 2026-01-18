(() => {
  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Modal elements
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalDesc = document.getElementById("modalDesc");
  const modalGallery = document.getElementById("modalGallery");

  // ----------------------------
  // Fullscreen image viewer (LIGHTBOX)
  // ----------------------------
  const imgViewer = document.getElementById("imgViewer");
  const imgViewerImg = document.getElementById("imgViewerImg");

  function isImageViewerOpen() {
    return imgViewer && imgViewer.getAttribute("aria-hidden") === "false";
  }

  function openImageFullscreen(src, alt = "") {
    if (!imgViewer || !imgViewerImg) return;
    imgViewerImg.src = src;
    imgViewerImg.alt = alt;
    imgViewer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeImageFullscreen() {
    if (!imgViewer || !imgViewerImg) return;
    imgViewer.setAttribute("aria-hidden", "true");
    imgViewerImg.src = "";
    // On ne remet pas overflow ici si la modal est ouverte
    // (sinon ça réactive le scroll alors que la modal bloque)
    if (modal?.getAttribute("aria-hidden") === "true") {
      document.body.style.overflow = "";
    }
  }

  imgViewer?.addEventListener("click", closeImageFullscreen);

  // ----------------------------
  // Modal
  // ----------------------------
  function openModal({ title, software, date, desc, images }) {
    modalTitle.textContent = title || "Projet";
    modalMeta.textContent = [software, date].filter(Boolean).join(" • ");
    modalDesc.textContent = desc || "";

    modalGallery.innerHTML = "";
    (images || []).forEach((src) => {
      const clean = (src || "").trim();
      if (!clean) return;

      const img = document.createElement("img");
      img.src = clean;
      img.alt = `${title || "Projet"} – image`;
      img.loading = "lazy";
      img.style.cursor = "zoom-in";

      // ✅ clic => fullscreen
      img.addEventListener("click", (e) => {
        e.stopPropagation(); // évite que ça ferme la modal
        openImageFullscreen(clean, img.alt);
      });

      modalGallery.appendChild(img);
    });

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");

    // Si la lightbox est ouverte, on la ferme aussi
    if (isImageViewerOpen()) closeImageFullscreen();

    document.body.style.overflow = "";
  }

  // Open modal on project click
  const projectCards = Array.from(document.querySelectorAll(".project"));
  projectCards.forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.dataset.title;
      const software = card.dataset.software;
      const date = card.dataset.date;
      const desc = card.dataset.desc;

      const imagesRaw = card.dataset.images || "";
      const images = imagesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      openModal({ title, software, date, desc, images });
    });
  });

  // Close modal (backdrop / button)
  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.dataset && target.dataset.close === "true") {
      closeModal();
    }
  });

  // ESC: ferme d’abord la lightbox, sinon la modal
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    if (isImageViewerOpen()) {
      closeImageFullscreen();
      return;
    }

    if (modal.getAttribute("aria-hidden") === "false") {
      closeModal();
    }
  });

  // ----------------------------
  // HERO CAROUSEL (auto + arrows)
  // ----------------------------
  const heroImg = document.getElementById("heroCarouselImg");
  const dotsWrap = document.getElementById("heroDots");
  const leftBtn = document.querySelector(".hero-arrow.left");
  const rightBtn = document.querySelector(".hero-arrow.right");

  const heroItems = projectCards
    .map((card) => {
      const title = card.dataset.title || "Projet";
      const imagesRaw = card.dataset.images || "";
      const images = imagesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const src = images[0];
      return src ? { src, title } : null;
    })
    .filter(Boolean);

  if (heroImg && heroItems.length > 0) {
    let index = 0;
    let timerId = null;

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      heroItems.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "hero-dot" + (i === index ? " active" : "");
        b.setAttribute("aria-label", `Aller à l’image ${i + 1}`);
        b.addEventListener("click", () => {
          index = i;
          updateHero();
          restartAuto();
        });
        dotsWrap.appendChild(b);
      });
    }

    function updateHero() {
      const item = heroItems[index];
      heroImg.src = item.src;
      heroImg.alt = `Aperçu : ${item.title}`;
      renderDots();
    }

    function next() {
      index = (index + 1) % heroItems.length;
      updateHero();
    }

    function prev() {
      index = (index - 1 + heroItems.length) % heroItems.length;
      updateHero();
    }

    function startAuto() {
      timerId = window.setInterval(next, 4000);
    }

    function stopAuto() {
      if (timerId) window.clearInterval(timerId);
      timerId = null;
    }

    function restartAuto() {
      stopAuto();
      startAuto();
    }

    if (leftBtn) {
      leftBtn.addEventListener("click", () => {
        prev();
        restartAuto();
      });
    }
    if (rightBtn) {
      rightBtn.addEventListener("click", () => {
        next();
        restartAuto();
      });
    }

    const heroCard = heroImg.closest(".hero-card");
    if (heroCard) {
      heroCard.addEventListener("mouseenter", stopAuto);
      heroCard.addEventListener("mouseleave", startAuto);
    }

    updateHero();
    startAuto();
  }

  // ----------------------------
  // BUTTON TILT (follow cursor)
  // ----------------------------
  const tiltButtons = document.querySelectorAll(".btn");

  tiltButtons.forEach((btn) => {
    const maxTilt = 10;
    const lift = 3;

    function onMove(e) {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      const nx = (x / r.width) * 2 - 1;
      const ny = (y / r.height) * 2 - 1;

      const rotY = nx * maxTilt;
      const rotX = -ny * maxTilt;

      btn.style.transform =
        `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-${lift}px)`;

      btn.style.setProperty("--mx", `${(x / r.width) * 100}%`);
      btn.style.setProperty("--my", `${(y / r.height) * 100}%`);
    }

    function onEnter() {
      btn.style.transition = "transform 80ms ease, filter 120ms ease";
    }

    function onLeave() {
      btn.style.transition = "transform 180ms ease, filter 120ms ease";
      btn.style.transform =
        "perspective(700px) rotateX(0deg) rotateY(0deg) translateY(0px)";
      btn.style.removeProperty("--mx");
      btn.style.removeProperty("--my");
    }

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
  });

  // ----------------------------
  // Fullscreen video reveal on scroll
  // ----------------------------
  const revealSection = document.querySelector(".video-reveal");
  const revealVideo = document.getElementById("showreelVideo");

  if (revealSection && revealVideo) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealVideo.play().catch(() => {});
        } else {
          revealVideo.pause();
        }
      }
    }, { threshold: 0.2 });

    io.observe(revealSection);

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function onScroll() {
      const rect = revealSection.getBoundingClientRect();
      const vh = window.innerHeight;

      const total = rect.height - vh;
      const passed = -rect.top;
      const t = total > 0 ? clamp(passed / total, 0, 1) : 0;

      const opacity = clamp((t - 0.05) / 0.25, 0, 1);
      const scale = 1.06 - (0.06 * opacity);

      revealVideo.style.opacity = String(opacity);
      revealVideo.style.transform = `scale(${scale.toFixed(4)})`;
    }

    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
      }
    }, { passive: true });

    window.addEventListener("resize", onScroll);
    onScroll();
  }
})();
