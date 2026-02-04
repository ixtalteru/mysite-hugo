document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".codeblock").forEach((block) => {
    const btn = block.querySelector(".copy-btn");
    const code = block.querySelector("pre code");
    if (!btn || !code) return;

    btn.addEventListener("click", async () => {
      const text = code.innerText.replace(/\n$/, ""); // 末尾改行を1つだけ除去

      try {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = "Copied!";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = old;
          btn.disabled = false;
        }, 1200);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);

        const old = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = old), 1200);
      }
    });
  });
});
