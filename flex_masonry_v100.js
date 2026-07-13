/**
 * Flex Masonry
 * 
 * Requirements:
 * 1. Ordering image display from LEFT to RIGHT
 * 2. Detect window resize to animate
 * 3. No other library, pure vanilla is the most delicious.
 * 
 * 
 * Limitations:
 * 1. Only support 1 masonry container (DO NOT add unnecesary code for future-proof)
 *    --> calling init() more than once is unsupported.
 * 
 * Required styles:
 
.masonry_container {
  display: flex;
  align-items: flex-start;
}

.masonry_container > * {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 0; 
}

 */

(function () {
  "use strict";

  const masonry_column_class = 'masonry-column';
  let _masonry_container = null;
  let _config = {};
  let masonry_resize_listener_added = false;
  let masonry_resize_timeout = null;

  let waitStartTime = 0;
  const MAX_WAIT_MS = 5000; // 5 seconds

  /**
   * Initializes or re-renders the masonry layout.
 * @param {Element} masonry_container - The masonry container element.
 * @param {number} columnsCount - Number of columns (0 = auto-calculate based on width).
 * @param {number} minItemWidth - Target minimum pixel width per column for auto-calculation.
 * @param {boolean} animate - Whether to animate the items moving to their new positions.
 */

  function init(masonry_container, fixedColumnsCount = 0, minItemWidth = 200, animate = true) {
    if (!masonry_container) return;

    // save value
    _masonry_container = masonry_container;
    _config = {
      fixedColumnsCount,
      minItemWidth,
      animate
    };

    // check MUST-HAVE attributes
    const computedStyle = getComputedStyle(masonry_container);
    if (!computedStyle.display.includes("flex")) {
        masonry_container.style.display = "flex";
    }
    if (!computedStyle.alignItems.includes("flex-start")) {
        masonry_container.style.alignItems = "flex-start"; // left to right
    }

    refresh();

    // create resize listener if not exist yet
    if (! masonry_resize_listener_added) {
      window.addEventListener('resize', () => {
        clearTimeout(masonry_resize_timeout);
        /* half second delay is "perfect" (not too slow/fast) to prevent unnecessary reflows */
        masonry_resize_timeout = setTimeout(refresh, 500); 
      });
      masonry_resize_listener_added = true;
    }
  } 

  function refresh() {
    // get value
    if (!_masonry_container) return;
    const masonry_container = _masonry_container;
    let { fixedColumnsCount, minItemWidth, animate } = _config;
    
    // 1. Auto-calculate columns based on container width if fixedColumnsCount < 1
    let columnsCount;
    if(fixedColumnsCount < 1) {
      columnsCount = Math.max(1, Math.floor(masonry_container.offsetWidth / minItemWidth));
    } else {
      columnsCount = fixedColumnsCount;
    }

    // 2a. Collect all cols of this container 
    const cols = Array.from(masonry_container.children);
    if (cols.length === 0) return; // nothing to process

    let items = [];

    // 2b. Check if this real col or just an item ?
    cols.forEach((col) => {
      if (col.classList.contains(masonry_column_class)) {
        // it is a column, so get its children
        const subItems = Array.from(col.children);
        // append all subItems as item
        items.push(...subItems);
      } else {
        // it is an item
        items.push(col);
      }
    });

    // 2c. Detect if any items (<img>s) still loading?
    const stillLoadingImage = items.some(item => {
      const img = item.querySelector("img");
      if (!img) return false;

      // important to check BOTH `complete` flag and actual img's naturalHeight
      return !img.complete || img.naturalHeight === 0;
    });

    if(stillLoadingImage) {
      if (waitStartTime === 0) {
        waitStartTime = performance.now();
      }
      const elapsed = performance.now() - waitStartTime;
      if (elapsed >= MAX_WAIT_MS) {
        console.warn(`FlexMasonry: timeout waiting for images (${MAX_WAIT_MS} ms)`);

        waitStartTime = 0; // reset for future trial
        return;
      }

      console.log(`refresh(), items not ready, retrying...${elapsed}`);
      requestAnimationFrame(refresh);
      return;
    }
    waitStartTime = 0;

    // 2d. Sort items based on their original sequence using dataset.index
    items.sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));

    //console.log(`refresh(), total items: ${items.length}, columnsCount: ${columnsCount}, containerWidth: ${masonry_container.offsetWidth}, minItemWidth: ${minItemWidth}`);

    // Animation using FLIP : record current positions before reflow
    const firstPositions = new Map();
    if(animate) {
      items.forEach(item => {
        firstPositions.set(item, item.getBoundingClientRect());
      });
    }

    // 3. Clear container and build fresh column wrappers
    masonry_container.innerHTML = '';
    const columns = Array.from({ length: columnsCount }, () => {
      const col = document.createElement('div');
      col.classList.add(masonry_column_class); /* important to identify it is a column (not an item) */
      masonry_container.appendChild(col);
      return col;
    });

    // 4. Distribute items sequentially into the currently shortest column
    const heights = Array(columnsCount).fill(0);

    items.forEach(item => {
      let shortest = 0;
      for (let i=1;i<columns.length;i++) {
          if (heights[i] < heights[shortest])
              shortest = i;
      }
      columns[shortest].appendChild(item);
      heights[shortest] += item.offsetHeight;
    });

    // ------------------------------------------------------------
    // Animate items moving to their new positions (FLIP)
    // ------------------------------------------------------------
    if (animate && firstPositions && firstPositions.size === items.length) {
      // same size, passed validation, continue to animate.

      requestAnimationFrame(() => {
        items.forEach(item => {
          const first = firstPositions.get(item);
          const last = item.getBoundingClientRect();

          const dx = first.left - last.left;
          const dy = first.top - last.top;

          if (dx !== 0 || dy !== 0) {
            // Move item back to its previous position
            item.style.transition = "none";
            item.style.transform = `translate(${dx}px, ${dy}px)`;
          }
        });

        requestAnimationFrame(() => {
          items.forEach(item => {
            item.style.transition = "transform 600ms cubic-bezier(.22,.61,.36,1)";
            item.style.transform = "translate(0,0)";

            // Cleanup after animation finishes
            item.addEventListener("transitionend", () => {
              item.style.transition = "";
              item.style.transform = "";
            }, { once: true });
          });
        });
      });
    }
  }

  // Export and freeze to prevent add new property
  window.FlexMasonry = Object.freeze({
    version: "1.0.0",
    init,
    refresh
  });

})();