## Preset 1: Default ##

![Default preset example](./assignment4/assets/a4-preset-default.png)

This is essentially the basic form of the Physarum algorithm, based on the class example.  It runs at a decent speed, creates intriguing cellular structures, and doesn't quickly collapse on itself.

## Preset 2: Cell Pulse ##

![Cell Pulse preset example](./assignment4/assets/a4-preset-cell-pulse.png)

The particles/agents in the simulation don't go far from each other position, but move out and back in a rhythmic fashion - giving the whole canvas a "pulse".  This is done by significantly devaluing agents' left and forward sensor values (to 0% and 10% respectively), so that agents are usually inclined to steer in clockwise loops.

## Preset 3: Mouse Guide ##

![Mouse Guide preset example](./assignment4/assets/a4-preset-mouse-guide.png)

This provides ideal conditions for mouse interaction, using the "Attract" force setting.  Agents near the cursor will stick close to it, allowing the user to "draw" lines branching from existing ones.  Deviating from this preset can cause some unpredictable (but interesting!) behavior, like making the drawn lines harder to pull or more prone to branching.  (Note that in any preset using the mouse, agents in range are colored blue.)

## Preset 4: Cloud Punch ##

![Cloud Punch preset example](./assignment4/assets/a4-preset-cloud-punch.png)

A high sensor distance, high sensor angle, and low movement speed causes agents to form fuzzy clouds that don't move much.  Here the mouse's force setting is "Repulse", which forms holes in the clouds.  Agents just out of the cursor's range tend to stay there, forming a halo that more lines can stem from.

## Preset 5: Highways ##

![Highways preset example](./assignment4/assets/a4-preset-highways.png)

Here, a low sensor distance and sensor angle cause agents to form (mostly) even lines across the canvas, giving the appearance of a highway map.  While thicker lines closely match the pattern appearing just before using this preset, many other faded-out "highways" form in the background as well.

## Preset 6: Spin Blur ##

![Spin Blur preset example](./assignment4/assets/a4-preset-spin-blur.png)

Like "Cloud Punch", this preset causes agents to stand still for the most part.  When in range of the cursor, however, agents receive uneven sensor values (like in "Cell Pulse") and are pulled toward it.  This creates a vortex effect for a small area, allowing the user to twist parts of the image as they move the mouse.  Transforming the canvas like this can create some very interesting blurred, misty shapes unlike any the simulation could produce by itself.