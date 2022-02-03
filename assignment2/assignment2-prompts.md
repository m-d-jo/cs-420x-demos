For this WebGL demo, I wanted to continue my experimentation with cellular noise (see my previous project: [Voronoi Cells](https://github.com/m-d-jo/cs-420x-demos#assignment-1-voronoi-cells)).  This time, I wanted to get a better understanding of how voronoi patterns are actually calculated, since WebGL doesn't have the same `voronoi()` helper function that The Force has.

The Book of Shaders (specifically the chapter on [Cellular Noise](https://thebookofshaders.com/12/)) was very helpful in learning how to make cellular-looking structures myself.  I was surprised to learn that this involved splitting the canvas into "tiles", with one cell "origin" (the point from which distances are measured) being placed in each.  Once I felt I had a grasp of how the sample fragment shader worked, I began to think about how I wanted to expand from it.

The design I settled on was something between soap bubbles and stained glass.  I wanted to make a filter that felt fluid and flexible, yet sharp along the edges - as well as include the same refraction/magnification effect I'd created in the last project.  The first challenge I took on was the sharp edges - I knew I would need a way to keep all the voronoi lines consistent in thickness.  This lead me to [an article by Inigo Quilez](https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm) linked in the Book of Shaders explaining how to make precise borders between cells.  This took a long time for me to understand, since I was new to voronoi calculations in general - but ultimately I was able to piece together the purpose of each operation, and I'm very happy with the result!  Second was the the glassy/bubbly distortion, which I did by storing the distance from border pixels to their closest point as a `vec2`.  This allowed me to not only distort only toward the edges, but also distort in a reasonable direction toward the center, making for a pleasant somewhat-realistic effect.

Lastly, for the interaction portion of the assignment I chose to recolor the cells and cell borders using HSV color values.  The user can control these colors with Tweakpane sliders in the upper right corner.  The mouse position is also used in the shader - as the cursor is moved around, cells will snap into place around it, and the background video feed will shift around as a nice perspective effect.