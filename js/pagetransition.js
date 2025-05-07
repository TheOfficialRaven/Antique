document.addEventListener("DOMContentLoaded", () => {
    // Ne induljon az oldal 0 opacitással
    document.body.classList.remove("fade-out");

    // Fade-out minden belső linkre (nem külső, nem target="_blank")
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href, location.origin);

      const isSameSite = url.origin === location.origin;
      const isAnchor = url.hash && url.pathname === location.pathname;
      const isBlank = link.target === "_blank";

      if (isSameSite && !isAnchor && !isBlank) {
        link.addEventListener("click", e => {
          e.preventDefault();
          document.body.classList.add("fade-out");
          setTimeout(() => location.href = link.href, 600); // 300ms = CSS transition idő
        });
      }
    });
  });