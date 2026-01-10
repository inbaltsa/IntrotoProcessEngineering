document.addEventListener("DOMContentLoaded", () => {
  console.log("solution tracking loaded");

  // למצוא את כל ה-callouts בעמוד
  const callouts = document.querySelectorAll(".callout");
  console.log("found callouts:", callouts.length);

  callouts.forEach((block, i) => {
    // לתת ID אם אין
    if (!block.id) {
      block.id = `solution_${i}`;
    }

    const header = block.querySelector(".callout-header") || block;

    header.addEventListener("click", () => {
      const id = block.id;
      console.log("Solution opened:", id);

      if (window.gtag) {
        gtag("event", "solution_opened", {
          solution_id: id
        });
      }
    });
  });
});
