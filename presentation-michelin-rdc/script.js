/**
 * Michelin RDC — Plan d'action 2026-2030
 * Navigation, transitions, lightbox, plein écran
 */

(function () {
  "use strict";

  /* ---------- Éléments DOM ---------- */
  const slides = Array.from(document.querySelectorAll(".slide"));
  const totalSlides = slides.length;
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const currentSlideEl = document.getElementById("currentSlide");
  const totalSlidesEl = document.getElementById("totalSlides");
  const progressBar = document.getElementById("progressBar");
  const sideNav = document.getElementById("sideNav");
  const sideNavToggle = document.getElementById("sideNavToggle");
  const sideNavButtons = Array.from(document.querySelectorAll("#sideNavList button"));
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnPrint = document.getElementById("btnPrint");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let currentIndex = 0;
  let isAnimating = false;
  let lightboxImages = [];
  let lightboxIndex = 0;

  /* ---------- Initialisation ---------- */
  function init() {
    if (totalSlidesEl) {
      totalSlidesEl.textContent = String(totalSlides);
    }

    // Index depuis le hash (#slide-3)
    const hashMatch = window.location.hash.match(/slide-(\d+)/);
    if (hashMatch) {
      const idx = parseInt(hashMatch[1], 10) - 1;
      if (idx >= 0 && idx < totalSlides) {
        currentIndex = idx;
      }
    }

    showSlide(currentIndex, false);
    bindEvents();
  }

  /* ---------- Affichage d'une slide ---------- */
  function showSlide(index, animate) {
    if (index < 0 || index >= totalSlides) return;
    if (animate !== false && index === currentIndex) return;
    if (isAnimating) return;

    const prevIndex = currentIndex;
    currentIndex = index;

    if (animate !== false) {
      isAnimating = true;
      const outgoing = slides[prevIndex];
      const incoming = slides[currentIndex];

      outgoing.classList.remove("active");
      if (index > prevIndex) {
        outgoing.classList.add("exit-left");
      }

      // Force reflow pour la transition
      void incoming.offsetWidth;
      incoming.classList.add("active");

      setTimeout(function () {
        outgoing.classList.remove("exit-left");
        isAnimating = false;
      }, 450);
    } else {
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === currentIndex);
        slide.classList.remove("exit-left");
      });
    }

    updateUI();
  }

  /* ---------- Mise à jour UI ---------- */
  function updateUI() {
    // Compteur
    if (currentSlideEl) {
      currentSlideEl.textContent = String(currentIndex + 1);
    }

    // Barre de progression
    if (progressBar) {
      const pct = ((currentIndex + 1) / totalSlides) * 100;
      progressBar.style.width = pct + "%";
      progressBar.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    // Boutons prev/next
    if (btnPrev) btnPrev.disabled = currentIndex === 0;
    if (btnNext) btnNext.disabled = currentIndex === totalSlides - 1;

    // Menu latéral
    sideNavButtons.forEach(function (btn, i) {
      btn.classList.toggle("active", i === currentIndex);
    });

    // Hash URL (sans recharger)
    history.replaceState(null, "", "#slide-" + (currentIndex + 1));
  }

  function goNext() {
    if (currentIndex < totalSlides - 1) {
      showSlide(currentIndex + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      showSlide(currentIndex - 1);
    }
  }

  function goTo(index) {
    showSlide(index);
    closeSideNav();
  }

  /* ---------- Menu latéral ---------- */
  function toggleSideNav() {
    const open = sideNav.classList.toggle("open");
    sideNavToggle.setAttribute("aria-expanded", String(open));
  }

  function closeSideNav() {
    sideNav.classList.remove("open");
    sideNavToggle.setAttribute("aria-expanded", "false");
  }

  /* ---------- Lightbox ---------- */
  function openLightbox(galleryImgs, startIndex) {
    lightboxImages = galleryImgs;
    lightboxIndex = startIndex;
    updateLightboxImage();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    lightboxImages = [];
    document.body.style.overflow = "";
  }

  function updateLightboxImage() {
    if (!lightboxImages.length) return;
    const img = lightboxImages[lightboxIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || "Aperçu";
  }

  function lightboxGo(delta) {
    if (!lightboxImages.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxImages.length) % lightboxImages.length;
    updateLightboxImage();
  }

  /* ---------- Plein écran ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {
        /* ignore */
      });
    } else {
      document.exitFullscreen();
    }
  }

  function updateFullscreenIcon() {
    if (!btnFullscreen) return;
    const icon = btnFullscreen.querySelector("i");
    if (!icon) return;
    if (document.fullscreenElement) {
      icon.className = "fas fa-compress";
      btnFullscreen.title = "Quitter le plein écran";
    } else {
      icon.className = "fas fa-expand";
      btnFullscreen.title = "Plein écran";
    }
  }

  /* ---------- Événements ---------- */
  function bindEvents() {
    // Navigation
    if (btnPrev) btnPrev.addEventListener("click", goPrev);
    if (btnNext) btnNext.addEventListener("click", goNext);

    // Clavier
    document.addEventListener("keydown", function (e) {
      // Ne pas intercepter si focus dans un champ
      if (e.target.matches("input, textarea, select")) return;

      // Lightbox prioritaire
      if (!lightbox.hidden) {
        if (e.key === "Escape") {
          closeLightbox();
          return;
        }
        if (e.key === "ArrowLeft") {
          lightboxGo(-1);
          return;
        }
        if (e.key === "ArrowRight") {
          lightboxGo(1);
          return;
        }
      }

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goPrev();
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(totalSlides - 1);
          break;
        case "Escape":
          closeSideNav();
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) toggleFullscreen();
          break;
      }
    });

    // Swipe tactile
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      function (e) {
        if (!e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        // Swipe horizontal dominant
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) goNext();
          else goPrev();
        }
      },
      { passive: true }
    );

    // Menu latéral
    if (sideNavToggle) {
      sideNavToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleSideNav();
      });
    }

    sideNavButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = parseInt(btn.getAttribute("data-slide"), 10);
        if (!isNaN(idx)) goTo(idx);
      });
    });

    // Fermer le menu au clic extérieur
    document.addEventListener("click", function (e) {
      if (sideNav.classList.contains("open") && !sideNav.contains(e.target)) {
        closeSideNav();
      }
    });

    // Pôles cliquables (slide 3)
    document.querySelectorAll(".pole-chip[data-goto]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        const idx = parseInt(chip.getAttribute("data-goto"), 10);
        if (!isNaN(idx)) goTo(idx);
      });
    });

    // Lightbox sur les images des galeries
    document.querySelectorAll(".image-gallery").forEach(function (gallery) {
      const imgs = Array.from(gallery.querySelectorAll("img"));
      imgs.forEach(function (img, i) {
        img.addEventListener("click", function () {
          openLightbox(imgs, i);
        });
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener("click", function () { lightboxGo(-1); });
    if (lightboxNext) lightboxNext.addEventListener("click", function () { lightboxGo(1); });

    if (lightbox) {
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    // Plein écran & impression
    if (btnFullscreen) btnFullscreen.addEventListener("click", toggleFullscreen);
    if (btnPrint) btnPrint.addEventListener("click", function () { window.print(); });

    document.addEventListener("fullscreenchange", updateFullscreenIcon);

    // Roue de souris (optionnel, pour mode présentation)
    let wheelLock = false;
    document.addEventListener(
      "wheel",
      function (e) {
        // Ignorer le scroll interne d'une slide longue
        const active = slides[currentIndex];
        if (active && active.scrollHeight > active.clientHeight + 10) {
          const atTop = active.scrollTop <= 0;
          const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 5;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
            return;
          }
        }

        if (wheelLock || !lightbox.hidden) return;
        if (Math.abs(e.deltaY) < 30) return;

        wheelLock = true;
        if (e.deltaY > 0) goNext();
        else goPrev();

        setTimeout(function () {
          wheelLock = false;
        }, 700);
      },
      { passive: true }
    );
  }

  /* ---------- Démarrage ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
