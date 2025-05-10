document.addEventListener("DOMContentLoaded", () => {
  // Animációs belépés (fade-in)
  document.body.style.opacity = "1";
  document.body.style.transition = "opacity 0.4s ease";

  // Minden belső linkre fade-out navigáció
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href, location.origin);
    const isSameSite = url.origin === location.origin;
    const isAnchor = url.hash && url.pathname === location.pathname;
    const isBlank = link.target === "_blank";

    if (isSameSite && !isAnchor && !isBlank) {
      link.addEventListener("click", e => {
        e.preventDefault();
        document.body.style.opacity = "0";
        setTimeout(() => location.href = link.href, 400); // időzítés illesztve a CSS átmenethez
      });
    }
  });
});

