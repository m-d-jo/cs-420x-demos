### 1. Describe your aesthetic intent and what you were interested in exploring technically. ###

The main function I wanted to experiment with was voronoi tesselation.  I had seen it used to make smooth, fluid cellular structures in shaders in the past and was excited to try it myself.  I was also drawn to the step function, which allowed me to form hard edges around fuzzy shapes and noise.  Using this on the gradient voronoi pattern, which forms gradients by defailt, resulted in a set of clearly-defined blobs to shift around.  Furthermore, using multiple different step thresholds made it possible for each blob to have multiple bands each with their own color.

Leaning into the cellular appearance, I decided to make my shader reminiscent of a petri dish under a microscope.  This included a magnifying effect around the mouse cursor (by warping UV coordinates based on distance to it), wobbling effects around cell edges, and smoother watery lines to fill in the far background.  I also opted for a stark contrast between the pixels inside the "lens" and those outside.  By default each cell only has its "nucleus" (orb in the middle) and outer rim colored, using colder tones; these both have a fairly strong rippling effect as well.  Near the mouse, however, the nuclei turn bright red, the outer layer is filled in with orange, and the background becomes bright yellow.  Additionally, the rippling is decreased within the influence of the cursor - giving the lens a "stabilizing" property over the cell edges.

--

### 2. Play your animation for a classmate. Describe the feedback of your classmate and whether or not it matched your expectations. ###

I received feedback from a few other students, who also interpreted this as cells floating around. They enjoyed the contrasting color schemes I used, and the variety of shifting patterns that cut into one another.  One reviewer also mentioned the shapes could resemble planets, with the dark background and layers surrounding each one.  Though I was open to any ideas and wasn't sure what to anticipate, I was pleased to know that my initial concept was conveyed clearly enough to be understood quickly.
