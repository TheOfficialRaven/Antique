// --- Lightbox galéria ---
const imgModal    = document.getElementById("imageModal");
const modalInner  = document.querySelector(".img-modal-inner");
const modalImg    = document.getElementById("modalImage");
const modalCloser = document.querySelector(".img-modal-close");
let currentGallery = [];
let currentIndex   = 0;

// modal bezárása
const toggleClose = () => imgModal.classList.remove("show");
modalCloser.onclick = toggleClose;

// kép vagy thumbnail kattintás
// kibővítve: item-card vagy gallery-item
document.addEventListener("click", e => {
  const tgt = e.target;
  const cardImage = tgt.tagName === "IMG" && (tgt.closest(".item-card") || tgt.closest(".gallery-item"));
  if (cardImage) {
    if (tgt.closest(".item-card")) {
      currentGallery = JSON.parse(tgt.dataset.gallery || "[]");
      currentIndex   = currentGallery.indexOf(tgt.src);
      if (currentIndex < 0) currentIndex = 0;
    } else {
      // galéria esetén csak az adott kép
      currentGallery = [tgt.src];
      currentIndex   = 0;
    }
    modalImg.src = currentGallery[currentIndex];
    imgModal.classList.add("show");
  }
});

// modalInner kattintás: lapozás (csak több képes galériához)
modalInner.addEventListener("click", e => {
  if (e.target === modalCloser) return;
  if (currentGallery.length < 2) return;
  const rect   = modalInner.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX < rect.width / 2) {
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  } else {
    currentIndex = (currentIndex + 1) % currentGallery.length;
  }
  modalImg.src = currentGallery[currentIndex];
});

// háttérre kattintás: bezárás
imgModal.addEventListener("click", e => {
  if (e.target === imgModal) toggleClose();
});