document.addEventListener("DOMContentLoaded", () => {
  const toc = document.getElementById("TableOfContents");
  if (!toc) return;

  const tocLinks = toc.querySelectorAll("a");
  const headings = document.querySelectorAll("h2[id]");

  if (!tocLinks.length || !headings.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          tocLinks.forEach(link => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`
            );
          });
        }
      });
    },
    {
      rootMargin: "0px 0px -65% 0px",
      threshold: 0.1
    }
  );

  headings.forEach(h => observer.observe(h));
});
