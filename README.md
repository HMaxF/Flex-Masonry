# Flex-Masonry

Diplay many images in various ratios, a mixed of square, portrait, tall, wide and panorama images.

# Requirements
1. Ordering/displaying images from LEFT to RIGHT.
2. Fixed Width gallery
   * Column width is a parameter.
4. Responsive, auto detect window resize and change column count.
   * Using simple JS FLIP (First-Last-Invert-Play)
5. Animate items moving to new position when column count changed.
6. Small and no dependency, tiny and pure vanilla is the most delicious.
  * DO NOT add unnecesary code for future-proof, requirements are fixed !

# Limitations
1. Only support 1 masonry container, design to display images full screen.


# CSS
Mandatory style:
if the container has id="masonry_container"
<pre>
#masonry_container {
  display: flex;
  align-items: flex-start;
}

#masonry_container > * {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 0; 
}
</pre>

![Flex Masonry screenshot](Flex-Masonry-Screenshot.png)
