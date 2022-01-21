float voronoistep(vec2 uvv2, float stepf) {
    return step(stepf, voronoi(uvv2));
}

float map(float val, float inmin, float inmax, float outmin, float outmax) {
    return (val - inmin) * (outmax - outmin) / (inmax - inmin) + outmin;
}

float map01(float val, float inmin, float inmax) {
    return map(val, inmin, inmax, 0., 1.);
}

void main() {
  float xscalar = resolution.x / resolution.y;
  
  float mousex = mouse.x / resolution.x - 1.;
  float mousey = -mouse.y / resolution.y + 1.;
  vec2 mousepos = vec2(mousex, mousey); // -1. to 1.

  vec2 pos = uv();
  vec2 psliding = pos;

  // Noise

  vec3 postime = vec3(pos * 25., time);
  float finenoise = snoise(postime) * 0.01;
  vec2 finedisplace = vec2(finenoise);
  
  float coarsenoise = snoise(postime) * 0.07;
  vec2 coarsedisplace = vec2(coarsenoise);
  
  float fluidnoise = snoise(postime * 0.1) * 3.;
  vec2 fluiddisplace = vec2(fluidnoise);

  // Circle around mouse

  float mousecircle = circle(mousepos.x * xscalar, mousepos.y, 0.6, 0.05);
  float invmousecircle = 1. - mousecircle;
  float mousecircleinnerfield = circle(mousepos.x * xscalar, mousepos.y, 0.6, 1.0);
  float mousecircleouterfield = circle(mousepos.x * xscalar, mousepos.y, 0.9, 0.7);
  
  // Warping inside circle
  
  vec2 ps2 = vec2(psliding.x / xscalar, psliding.y);
  vec2 displace = ps2 - mousepos;
  if (mousecircleinnerfield > 0.) {
    displace.x = map01(displace.x, 0., 0.4);
    displace.y = map01(displace.y, 0., 0.4);
    psliding -= displace * mix(0., 0.5, mousecircleinnerfield);
  }
  else {
    displace.x = map01(displace.x, 0., 0.5);
    displace.y = map01(displace.y, 0., 0.5);
    psliding += displace * mix(0., 0.1, mousecircleouterfield);
  }
  
  float factor = 5.;
  psliding += max(0., sin(time * 0.2)) * snoise(postime) * 0.01 * factor;
  fluiddisplace += max(0., sin(time * 0.2)) * snoise(postime) * 0.1 * factor;

  // Scaling up everything

  psliding *= 2.;
  psliding += vec2(mousepos.x, mousepos.y);

  // Shapes

  float inner = 1. - voronoistep(psliding + finedisplace, 0.1);
  float mid = 1. - voronoistep(psliding + finedisplace, 0.3) - inner;
  float outer = 1. - mid - inner;
  
  float coarseinner = 1. - voronoistep(psliding + coarsedisplace, 0.1);
  float coarseoutline = voronoistep(psliding + finedisplace, 0.28) - voronoistep(psliding + coarsedisplace, 0.3);
  
  float fluid = 1. - smoothstep(0.1, 0.2, voronoi(pos + fluiddisplace));
  
  // Coloring
  
  vec4 outercolor = vec4( outer ) * vec4(yellow, 1.);
  vec4 midcolor = vec4( mid ) * vec4(orange, 1.);
  vec4 innercolor = vec4( inner ) * vec4(red, 1.);
  
  // Both blend color toward circle
  vec4 coarseinnercolor = vec4( coarseinner ) * mix(vec4(green, 1.), vec4(red, 1.), mousecircleouterfield);
  vec4 coarseoutlinecolor = vec4( coarseoutline ) * mix(vec4(purple, 1.), vec4(orange, 1.), mousecircleouterfield);
  
  vec4 fluidcolor = vec4( fluid ) * mix(vec4(blue * 0.9, 1.), vec4(0.05, 0.05, 0.15, 1.), 0.);


  // Adding results
  
  vec4 inmouse = (outercolor + midcolor + innercolor) * mousecircle;
  vec4 outsidemouse = (coarseinnercolor + coarseoutlinecolor + fluidcolor) * invmousecircle;
  
  gl_FragColor = inmouse + outsidemouse;
}