import { useEffect, useRef, useState } from 'react'

// The earth as NASA photographed it: Blue Marble for the day side, Black
// Marble for the lights at night, and a map of the clouds. The moon is from
// its Lunar Reconnaissance Orbiter.
import earthClouds from '../images/earth-clouds.jpg'
import earthDay from '../images/earth-day.jpg'
import earthNight from '../images/earth-night.jpg'
import moonSurface from '../images/moon.jpg'

interface StarfieldProps {
  className?: string
}

const STARS = 2600

// Seconds for a star to travel from the far end of the field to the camera.
// Slow enough to read as a drifting camera rather than as flight.
const FLIGHT = 260

// The spot on the earth that faces the camera, in degrees north and east.
// Once its maps have loaded the earth fades in over DAWN seconds, and takes
// ARRIVAL seconds to slide up into place while its spin slows down to the
// speed it keeps afterwards.
const FACING = { latitude: 40, longitude: 14 }
const DAWN = 2
const ARRIVAL = 5

// Where the earth is and how large: its middle as a part of the way from
// the middle of the screen to the right edge, and how far it lies below the
// bottom edge, that and its radius measured in the short side of the screen.
// On an upright screen, such as a phone, it sits nearer the middle and a
// little to the left instead, which brings its night side with the lights
// of the cities into view.
const EARTH = { right: 0.6, upright: -0.3, below: 0.22, radius: 0.62 }

// How wide a screen of the given shape counts as, from 0 for an upright
// one to 1, going evenly from the one to the other. The shader works this
// out the same way.
function wideness(width: number, height: number) {
  const shape = Math.min(Math.max((width / height - 0.8) / 0.6, 0), 1)

  return shape * shape * (3 - 2 * shape)
}

// How far to the right the earth is on a screen of the given shape.
function aside(width: number, height: number) {
  return EARTH.upright + (EARTH.right - EARTH.upright) * wideness(width, height)
}

// How quickly the earth loses the spin it is thrown with; higher is sooner.
// What is left when that is gone is the turning it always does.
const FRICTION = 1.6

// A pointer that rested this many milliseconds before letting go was
// placing the earth, not spinning it.
const REST = 80

// The fastest the earth can be thrown, in radians per second: a little
// over one turn a second.
const FASTEST = 7

function limit(spin: number) {
  return Math.max(-FASTEST, Math.min(FASTEST, spin))
}

// Turns a direction as the camera sees it into a direction on the earth,
// so that FACING ends up in the middle of what is in view and the earth
// turns towards the camera and to the right. Laid out column by column, the way WebGL takes a matrix.
function globe() {
  const latitude = (FACING.latitude * Math.PI) / 180
  const longitude = (FACING.longitude * Math.PI) / 180
  const [sinLat, cosLat] = [Math.sin(latitude), Math.cos(latitude)]
  const [sinLon, cosLon] = [Math.sin(longitude), Math.cos(longitude)]

  // Up, east and north at that spot, first as the camera sees them. The
  // earth sits low on the screen, so the middle of it leans back. East is
  // the way the ground moves as the earth turns: to the right and towards
  // the camera, as far as that goes along the ground.
  const length = Math.hypot(-0.1, 0.72, 0.69)
  const up = [-0.1 / length, 0.72 / length, 0.69 / length]
  const aim = [1, -0.6, 0.6]
  const off = aim[0] * up[0] + aim[1] * up[1] + aim[2] * up[2]
  const flat = aim.map((part, axis) => part - off * up[axis])
  const reach = Math.hypot(flat[0], flat[1], flat[2])
  const east = flat.map((part) => part / reach)
  const north = [
    up[1] * east[2] - up[2] * east[1],
    up[2] * east[0] - up[0] * east[2],
    up[0] * east[1] - up[1] * east[0],
  ]

  // And the same three on the earth itself.
  const earthUp = [cosLat * sinLon, sinLat, cosLat * cosLon]
  const earthNorth = [-sinLat * sinLon, cosLat, -sinLat * cosLon]
  const earthEast = [cosLon, 0, -sinLon]

  const matrix = new Float32Array(9)

  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      matrix[column * 3 + row] =
        earthEast[row] * east[column] +
        earthNorth[row] * north[column] +
        earthUp[row] * up[column]
    }
  }

  return matrix
}

// The product of two 3 by 3 matrices, both laid out column by column.
function multiply(first: ArrayLike<number>, second: ArrayLike<number>) {
  const product = new Float64Array(9)

  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      product[column * 3 + row] =
        first[row] * second[column * 3] +
        first[3 + row] * second[column * 3 + 1] +
        first[6 + row] * second[column * 3 + 2]
    }
  }

  return product
}

// The earth turned as the camera sees it: its near side to the right and
// downwards by the given angles. Turning the earth one way is turning the
// camera's directions the other, which is why the angles are negated.
function turned(orientation: ArrayLike<number>, right: number, down: number) {
  const [cosDown, sinDown] = [Math.cos(-down), Math.sin(-down)]
  const [cosRight, sinRight] = [Math.cos(-right), Math.sin(-right)]

  return multiply(
    multiply(orientation, [1, 0, 0, 0, cosDown, sinDown, 0, -sinDown, cosDown]),
    [cosRight, 0, -sinRight, 0, 1, 0, sinRight, 0, cosRight],
  )
}

// Light given off by the sky as a colour to lay over the black behind it:
// the brighter it is, the more it covers.
const exposure = `
  vec4 expose(vec3 light) {
    float alpha = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);

    return vec4(light / max(alpha, 0.001) * alpha, alpha);
  }
`

// The far sky, painted per pixel: the band of our own galaxy seen from the
// inside, with dark lanes of dust and a haze of faint stars along it, now
// and then a shooting star, and in front of all that the earth and the
// moon.
const sky = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uPixelRatio;
  uniform float uSeconds;

  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uClouds;
  uniform sampler2D uMoon;
  uniform mat3 uGlobe;
  uniform float uDawn;
  uniform float uArrival;
  uniform float uHeld;

  ${exposure}

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 blend = fract(point);

    blend = blend * blend * (3.0 - 2.0 * blend);

    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
      blend.y
    );
  }

  float clouds(vec2 point) {
    float value = 0.0;
    float weight = 0.5;

    for (int octave = 0; octave < 5; octave++) {
      value += weight * noise(point);
      point = point * 2.03 + vec2(17.3, 9.1);
      weight *= 0.5;
    }

    return value;
  }

  // A shooting star: a small streak that crosses a bit of the sky in about
  // half a second and burns out. Each of the few there are comes back after a wait
  // of its own, from another place and in another direction every time.
  float meteor(vec2 point, vec2 edge, float which) {
    float wait = 25.0 + which * 17.0;
    // None of them is in the sky at the moment the page opens.
    float clock = uSeconds + wait * (0.3 + which * 0.25);
    float run = floor(clock / wait);
    float age = (clock - run * wait) / 0.6;

    if (age > 1.0) return 0.0;

    vec2 seed = vec2(run, which * 7.0 + 1.0);
    // It starts in the upper part of the sky and falls to either side.
    vec2 from = edge * vec2(hash(seed) * 2.0 - 1.0, 0.2 + 0.8 * hash(seed + 3.0));
    float slope = 0.5 + 0.9 * hash(seed + 5.0);
    vec2 way = vec2(cos(slope) * (hash(seed + 9.0) < 0.5 ? -1.0 : 1.0), -sin(slope));
    vec2 head = from + way * (0.22 + 0.15 * hash(seed + 11.0)) * age;

    // How far behind the head a pixel is, and how far off its path.
    vec2 back = point - head;
    float behind = max(-dot(back, way), 0.0);
    float aside = length(back + way * behind);
    float width = 0.9 * uPixelRatio / min(uResolution.x, uResolution.y);
    float tail = smoothstep(0.07, 0.0, behind);

    return exp(-aside * aside / (width * width)) * tail * tail
      * smoothstep(0.0, 0.15, age) * smoothstep(1.0, 0.5, age);
  }

  // Towards the sun, which is up to the left and nearly level with the
  // earth, so that night has fallen on the right of what is in view.
  const vec3 SUN = vec3(-0.88, 0.46, 0.1);

  const vec3 AIR = vec3(0.3, 0.56, 1.0);

  // Where on a map of a globe a direction from its centre is found.
  vec2 chart(vec3 place) {
    return vec2(
      atan(place.x, place.z) / 6.2831853 + 0.5,
      asin(clamp(place.y, -1.0, 1.0)) / 3.1415927 + 0.5
    );
  }

  // The moon: bare rock, with no air to soften the edge of its shadow. It
  // always shows the earth the same side, so the map needs no turning. It
  // is lit by the sun from the one given direction and, much more faintly,
  // by the earth from the other. The colour comes multiplied by how much of
  // the pixel it covers, and past the edge it is light only.
  vec4 moon(vec2 point, vec2 centre, float radius, vec3 sunlight, vec3 earthlight) {
    vec2 disc = (point - centre) / radius;
    float reach = length(disc);

    // A lens spreads a little of the light of the bright side around it,
    // which is what sets the moon in the sky and not on top of it.
    if (reach >= 1.0) {
      float towards = smoothstep(-0.3, 0.6, dot(vec3(disc / reach, 0.0), sunlight));

      return vec4(vec3(1.0, 0.97, 0.92) * exp((1.0 - reach) * 7.0) * towards * 0.07, 0.0);
    }

    float facing = sqrt(1.0 - reach * reach);
    vec3 normal = vec3(disc, facing);
    vec2 place = chart(normal);
    vec3 stone = pow(texture2D(uMoon, place).rgb, vec3(2.2));

    // The map only has how bright the ground is, which is taken for how
    // high it is as well: the pale highlands stand above the dark plains.
    // The ground is tilted by how that changes to the east and to the
    // north, about a pixel away, so that it catches the light or lies in
    // shadow as craters and ridges do near the edge of the night.
    vec3 eastward = normalize(vec3(normal.z, 0.0, -normal.x) + vec3(0.0001, 0.0, 0.0));
    vec3 northward = cross(normal, eastward);
    vec2 apart = 1.5 * uPixelRatio / min(uResolution.x, uResolution.y) / radius
      / vec2(6.2831853, 3.1415927);
    float east = texture2D(uMoon, place + vec2(apart.x, 0.0)).g
      - texture2D(uMoon, place - vec2(apart.x, 0.0)).g;
    float north = texture2D(uMoon, place + vec2(0.0, apart.y)).g
      - texture2D(uMoon, place - vec2(0.0, apart.y)).g;
    vec3 ground = normalize(normal - (eastward * east + northward * north) * 1.6);

    // Dust throws light back the way it came, which a smooth ball does
    // not, so the moon is nearly as bright at its edge as in its middle
    // and does not fade towards it. The night still begins where the ball
    // itself turns away from the sun, whatever the ground does there.
    float sun = max(dot(ground, sunlight), 0.0);
    float day = smoothstep(-0.02, 0.22, dot(normal, sunlight))
      * mix(sun, min(2.0 * sun / (sun + facing + 0.001), 1.4), 0.55);
    // The night side is lit by the earth, blue and very faint, so it shows
    // as the far half of a ball and not as a hole in the sky.
    float night = max(dot(ground, earthlight), 0.0) * (0.55 + 0.45 * facing);
    vec3 light = vec3(1.0, 0.98, 0.95) * day * 1.6 + vec3(0.5, 0.66, 1.0) * night * 0.035;
    // The edge fades out over a pixel or so: crisp, but not a hard line.
    float pixel = 1.2 * uPixelRatio / min(uResolution.x, uResolution.y) / radius;
    float cover = smoothstep(1.0, 1.0 - pixel, reach);

    return vec4(pow(stone * light, vec3(1.0 / 2.2)) * cover, cover);
  }

  // How far a point is from the line between two others.
  float segment(vec2 point, vec2 from, vec2 to) {
    vec2 along = to - from;
    vec2 offset = point - from;

    return length(offset - along * clamp(dot(offset, along) / dot(along, along), 0.0, 1.0));
  }

  // The seconds the earth takes to turn around once: slowly, but fast
  // enough for the ground to be seen moving.
  const float DAY = 450.0;

  // A hard flash and a weaker one after it, by the seconds since a strike.
  float flash(float since) {
    // Before the strike there is nothing, and it has to be said outright:
    // the fading below grows without end for a time that has yet to come.
    if (since <= 0.0) return 0.0;

    return smoothstep(0.0, 0.02, since) * exp(-since * 18.0)
      + 0.6 * smoothstep(0.15, 0.17, since) * exp(-max(since - 0.15, 0.0) * 24.0);
  }

  // The thunderstorms on the earth, of which there are a handful at a time.
  // Each lasts a while over a patch of cloud far from the camera, towards
  // the horizon, and strikes twice in that time. A strike falls from the
  // cloud straight down to the ground under it: a jagged channel with a
  // couple of forks, which also only go down, in a glow.
  //
  // Returned are the channel and the glow, kept apart since the cloud above
  // them dims the one and is lit up by the other.
  vec2 storms(vec3 normal, vec2 disc, vec2 drift) {
    vec2 total = vec2(0.0);

    for (int index = 0; index < 7; index++) {
      float which = float(index);
      float life = 7.0 + which * 1.7;
      float head_start = life * hash(vec2(which, 3.0));
      float clock = uSeconds + head_start;
      float run = floor(clock / life);
      float age = clock / life - run;
      vec2 seed = vec2(run, which * 7.0 + 1.0);

      // Where the storm is seen in the middle of its life: on the far side
      // of what is in view, but not so near the edge that a strike would
      // stick out over it.
      float towards = 0.38 + 0.22 * hash(seed);
      float around = radians(55.0 + 85.0 * hash(seed + 3.0));
      vec3 spot = vec3(sqrt(1.0 - towards * towards) * vec2(cos(around), sin(around)), towards);

      // It stays with the cloud it is in, which turns with the earth: the
      // place on the map of the clouds is fixed, and where that is seen
      // follows from it.
      float middle = (run + 0.5) * life - head_start;
      vec2 cloud = chart(uGlobe * spot) - vec2(middle / DAY * 1.2, 0.0);

      // Read from a coarse level of the map, for the cloud over the whole
      // area and not at one point of it.
      if (texture2D(uClouds, cloud, 4.0).r < 0.3) continue;

      vec2 map = cloud + drift;
      float east = (map.x - 0.5) * 6.2831853;
      float north = (map.y - 0.5) * 3.1415927;
      vec3 anchor = vec3(cos(north) * sin(east), sin(north), cos(north) * cos(east)) * uGlobe;

      // Zero right at the storm, growing with the angle away from it.
      float away = 1.0 - dot(normal, anchor);

      float since = age * life;
      float first = life * 0.3;
      float second = life * 0.62;
      float flicker = flash(since - first) + flash(since - second);

      if (flicker < 0.01 || away > 0.02) continue;

      // The two strikes of a storm are not alike.
      seed += since > second ? 5.0 : 0.0;

      // Straight up from the ground is straight out from the middle of the
      // earth, so the channel runs from the cloud, a little way up, to the
      // ground under it. No strike falls quite straight, though: each one
      // leans its own way.
      float lean = (hash(seed + 8.3) - 0.5) * 1.3;
      vec2 ground = anchor.xy;
      vec2 down = mat2(cos(lean), sin(lean), -sin(lean), cos(lean)) * ground * -0.03;
      vec2 top = ground - down;
      vec2 across = vec2(-down.y, down.x);
      vec2 last = top;
      float channel = 1.0;
      float forks = 1.0;

      for (int joint = 1; joint <= 6; joint++) {
        float along = float(joint) / 6.0;
        // The joints stray to the sides, except for the last one.
        float stray = joint == 6 ? 0.0 : (hash(seed + along * 7.1) - 0.5) * 0.22;
        vec2 next = top + down * along + across * stray;

        channel = min(channel, segment(disc, last, next));

        if (joint == 2 || joint == 4) {
          float side = hash(seed + along * 3.3) < 0.5 ? -1.0 : 1.0;
          vec2 tip = last;

          for (int twig = 1; twig <= 2; twig++) {
            vec2 further = tip
              + across * side * (0.05 + 0.08 * hash(seed + along + float(twig)))
              + down * (0.16 + 0.12 * hash(seed + along * 5.0 + float(twig)));

            forks = min(forks, segment(disc, tip, further));
            tip = further;
          }
        }

        last = next;
      }

      float bolt = exp(-channel * channel / 0.0000006) + 0.6 * exp(-forks * forks / 0.0000003);

      // The top of the channel is inside the cloud, so it only comes into
      // sight on its way out of it, and the glow is brightest up there.
      vec2 below = disc - top;

      bolt *= smoothstep(-0.05, 0.4, dot(below, down) / dot(down, down));

      float glow = 0.35 * exp(-min(channel, forks) * 420.0)
        + 0.6 * exp(-dot(below, below) / 0.00035);

      total += vec2(bolt, glow) * flicker * 2.2;
    }

    return total;
  }

  // The northern lights: a handful of separate strips of light scattered
  // over the far north, each lying its own way, with its own length, bend
  // and brightness, so that they make no ring around the pole. A strip is
  // a ribbon of green with a crisper edge on one side and a fade on the
  // other, where it turns violet, crossed by rays that ripple along it,
  // and it thins out to nothing towards its ends.
  //
  // The strips belong to the ground: they turn with the earth, by the given
  // part of a full turn. The slant is how much more of them there is to
  // look through where they are seen from the side, near the edge of the
  // earth. There they also crowd together until they are finer than the
  // pixels of the screen, so they are spread out to match, and the rays,
  // for which the given detail is the measure, are left out. That keeps
  // the horizon smooth.
  vec3 aurora(vec3 place, float turn, float slant, float detail) {
    // Nothing south of about 44 degrees, and what comes near that fades
    // out before it gets there instead of being cut off.
    if (place.y < 0.7) return vec3(0.0);

    float north = smoothstep(0.7, 0.8, place.y);

    // The top of the world laid out flat, as seen from above the pole, and
    // turned with the ground. One degree is about 0.009 across on it.
    float turned = turn * 6.2831853;
    vec2 top = mat2(cos(turned), sin(turned), -sin(turned), cos(turned))
      * place.xz / (1.0 + place.y);
    float spread = slant * slant;
    vec3 strips = vec3(0.0);

    for (int index = 0; index < 7; index++) {
      float which = float(index);
      // Where its middle is, which way it lies, half its length, how much
      // it bends and how bright it is.
      float bearing = hash(vec2(which, 1.0)) * 6.2831853;
      vec2 middle = (0.13 + 0.17 * hash(vec2(which, 2.0))) * vec2(cos(bearing), sin(bearing));
      float heading = hash(vec2(which, 3.0)) * 3.14159;
      vec2 way = vec2(cos(heading), sin(heading));
      float half_length = 0.08 + 0.14 * hash(vec2(which, 4.0));
      float bend = (hash(vec2(which, 5.0)) - 0.5) * 3.0;
      float bright = 0.6 + 0.6 * hash(vec2(which, 6.0));

      vec2 from_middle = top - middle;
      float along = dot(from_middle, way);

      if (abs(along) < half_length) {
        // It snakes a little, and slowly changes how.
        float across = dot(from_middle, vec2(-way.y, way.x))
          - bend * along * along
          - 0.012 * sin(along * 40.0 + which * 2.0 + uSeconds * 0.15);
        // The rays stand side by side along it, and flicker. They are kept
        // coarse: anything finer would be smaller than a pixel on a phone.
        float rays = 0.65 * noise(vec2(along * 55.0 + uSeconds * 0.06, which * 5.0 - uSeconds * 0.04))
          + 0.35 * noise(vec2(along * 125.0 - uSeconds * 0.09, which * 9.0));
        float curtains = mix(0.95, 0.55 + 0.9 * smoothstep(0.2, 0.8, rays), detail);
        float shimmer = mix(1.0, 0.8 + 0.2 * sin(uSeconds * 1.4 + rays * 20.0), detail);

        strips += bright * curtains * shimmer
          * smoothstep(half_length, half_length * 0.15, abs(along))
          * (
            vec3(0.12, 1.0, 0.42) * exp(-across * across / ((across < 0.0 ? 0.00014 : 0.0005) * spread))
            + vec3(0.6, 0.15, 0.85) * 0.35 * exp(-pow((across - 0.022 * slant) / (0.016 * slant), 2.0))
          );
      }
    }

    return strips * north * sqrt(slant);
  }

  // The earth, with its colour already multiplied by how much of the pixel
  // it covers: land and sea by day, cities by night, clouds and their
  // lightning over both, the northern lights, and the air as a blue haze
  // that thickens towards the edge and glows past it.
  vec4 earth(vec2 point, vec2 centre, float radius) {
    vec2 disc = (point - centre) / radius;
    float reach = length(disc);
    // While it arrives the earth is spun back a little under a tenth of a
    // turn, which it makes up fast at first and ever more slowly, until
    // what is left of its spin is exactly the speed it keeps afterwards.
    vec2 turn = vec2(uSeconds / DAY - 0.08 * pow(1.0 - uArrival, 3.0), 0.0);
    // What is right at the edge, seen from the side: how much of the sun's
    // light the air there catches, and the northern lights, which stand
    // high enough over the ground to show past it.
    float grazing = smoothstep(-0.35, 0.3, dot(vec3(disc / max(reach, 0.0001), 0.0), SUN));
    vec3 lights = vec3(0.0);

    if (reach > 0.98) {
      lights = aurora(uGlobe * vec3(disc / reach, 0.0), turn.x, 2.4, 0.0)
        * mix(1.0, 0.3, smoothstep(-0.12, 0.3, dot(vec3(disc / reach, 0.0), SUN))) * 0.8;
    }

    if (reach >= 1.0) {
      // Past the edge there is only the thin shell of air, lit from behind,
      // and the northern lights above it.
      float glow = exp((1.0 - reach) / 0.012) * grazing * 0.85;

      // They hang there like a curtain of silk: a soft veil whose upper
      // hem rises and falls gently along the edge, gathered in folds that
      // sway slowly, each catching the light on one side. It belongs to
      // the ground and turns with it, and goes from green to violet
      // towards its hem.
      vec3 over = uGlobe * vec3(disc / reach, 0.0);
      float compass = atan(over.z, over.x) + turn.x * 6.2831853;
      vec2 ring = vec2(cos(compass), sin(compass));
      float drape = 0.6 * noise(ring * 7.0 + uSeconds * 0.04)
        + 0.4 * noise(ring * 15.0 - uSeconds * 0.05);
      float tall = 0.014 + 0.03 * smoothstep(0.15, 0.9, drape);
      float above = (reach - 1.0) / tall;
      // The folds lean one way and the other the higher up they are, the
      // way cloth moves that hangs from one side.
      float sway = compass + 0.012 * above * sin(compass * 9.0 + uSeconds * 0.35);
      vec2 hung = vec2(cos(sway), sin(sway));
      float folds = 0.6 * noise(hung * 30.0 + uSeconds * 0.06)
        + 0.4 * noise(hung * 62.0 - uSeconds * 0.09);
      float sheen = 0.5 + 0.75 * smoothstep(0.25, 0.75, folds);

      lights = mix(lights, vec3(0.6, 0.15, 0.85) * lights.g * 0.6, smoothstep(0.4, 1.8, above))
        * exp(-pow(above, 1.4)) * mix(1.0, sheen, smoothstep(0.0, 0.5, above));

      return vec4(
        AIR * glow + lights,
        clamp(glow + max(lights.r, max(lights.g, lights.b)), 0.0, 1.0)
      );
    }

    vec3 normal = vec3(disc, sqrt(1.0 - reach * reach));
    // The clouds turn a little faster than the ground under them.
    vec3 place = uGlobe * normal;
    vec2 at = chart(place);
    vec3 map = texture2D(uDay, at - turn).rgb;
    vec3 ground = pow(map, vec3(2.2));
    vec3 cities = pow(texture2D(uNight, at - turn).rgb, vec3(2.2));

    // The map of the clouds is coarse this close up, so finer billows are
    // worked into it, and a few thin clouds are added where it has none.
    vec2 sky = at - turn * 1.2;
    // Detail finer than the pixels of the screen shows as grain. That is
    // what it becomes towards the edge of the earth, where the ground is
    // seen from the side, and near the poles, where the map crowds
    // together, so it is left out there.
    float facing = smoothstep(0.08, 0.45, normal.z) * smoothstep(0.97, 0.8, abs(place.y));
    float billows = mix(0.5, clouds(sky * vec2(160.0, 80.0)), facing);
    float wisps = smoothstep(0.55, 0.85, clouds(sky * vec2(70.0, 35.0) + 31.0)) * facing;
    float cover = smoothstep(
      0.08,
      0.85,
      texture2D(uClouds, sky).r * (0.5 + billows) + wisps * billows * 0.5
    );
    // The clouds between a place and the sun, which is to the west of it,
    // leave it in their shadow.
    float shadow = smoothstep(0.2, 0.9, texture2D(uClouds, sky - vec2(0.004, 0.0)).r);

    ground *= 1.0 - 0.4 * shadow;

    // No lightning strikes while the earth is held and turned by hand: the
    // storms keep their place on the screen, not on the ground.
    vec2 weather = storms(normal, disc, turn * 1.2) * (1.0 - uHeld);

    float sun = dot(normal, SUN);
    float day = smoothstep(-0.12, 0.3, sun);
    // Water is the part of the map that is more blue than red.
    float sea = smoothstep(0.02, 0.12, map.b - map.r);
    // The sun mirrored in the sea: a bright spot with a wide sheen around.
    float mirror = max(reflect(-SUN, normal).z, 0.0);
    float glint = (pow(mirror, 70.0) * 0.9 + pow(mirror, 8.0) * 0.07) * sea * (1.0 - cover);

    vec3 lit = mix(ground * 1.25 + glint, vec3(0.92), cover);

    lit *= 0.2 + 0.8 * clamp(sun, 0.0, 1.0);
    // Sunlight turns red where it reaches the ground at a low angle.
    lit *= mix(vec3(1.0, 0.5, 0.3), vec3(1.0), smoothstep(-0.05, 0.3, sun));

    vec3 dark = cities * vec3(1.0, 0.76, 0.46) * 2.2 * (1.0 - cover * 0.8);
    vec3 colour = lit * day + dark * (1.0 - smoothstep(-0.15, 0.05, sun));

    // Lightning strikes under the cloud. Its glow lights the cloud from
    // below, more where the cloud is thin, and hardly the ground where
    // there is none. The channel itself still shows through, dimmed. All of it shows best at night, but also
    // against the dark of its own cloud by day.
    colour += vec3(0.72, 0.83, 1.0) * (1.0 - 0.45 * day)
      * (weather.x * 0.6 + weather.y * (1.7 - 1.2 * billows) * (0.15 + 0.85 * cover));

    // Looking at the edge is looking through much more air.
    float haze = smoothstep(-0.3, 0.3, sun);

    colour = mix(colour, AIR * haze, haze * (0.1 + 0.75 * pow(1.0 - normal.z, 2.5)));

    // The northern lights hang above the clouds and the air. They are
    // bright in the dark and pale by day, and brighter towards the edge of
    // the earth, where they are seen from the side.
    colour += aurora(
      place,
      turn.x,
      1.0 / pow(max(normal.z, 0.23), 0.6),
      smoothstep(0.2, 0.55, normal.z)
    ) * mix(1.0, 0.3, day) * 0.8;

    // The last few pixels of the ground blend into what is right over the
    // edge, the glow of the air and the northern lights there, so that the
    // earth does not end in a hard line.
    float rim = grazing * 0.85;
    float soften = 2.5 * uPixelRatio / min(uResolution.x, uResolution.y) / radius;

    return mix(
      vec4(AIR * rim + lights, clamp(rim + max(lights.r, max(lights.g, lights.b)), 0.0, 1.0)),
      vec4(pow(colour, vec3(1.0 / 2.2)), 1.0),
      smoothstep(1.0, 1.0 - soften, reach)
    );
  }

  void main() {
    float shortest = min(uResolution.x, uResolution.y);
    vec2 point = (gl_FragCoord.xy - 0.5 * uResolution) / shortest;
    // Half the screen in the same units, to place things relative to it.
    vec2 edge = 0.5 * uResolution / shortest;

    vec2 drift = point * 1.5 + vec2(uSeconds * 0.0015, -uSeconds * 0.001);
    float warp = clouds(drift * 1.3 + 4.0);
    float gas = clouds(drift + warp * 1.3);
    float across = point.y * 0.9 - point.x * 0.5 + 0.12 + (warp - 0.5) * 0.5;
    float band = exp(-across * across * 5.0);
    // The band has a wide, faint halo of thinner clouds around it, and
    // swells into a bright bulge where the middle of the galaxy is.
    float halo = exp(-across * across * 2.2);
    float along = point.x * 0.9 + point.y * 0.5 - 0.1;
    float bulge = exp(-across * across * 9.0 - along * along * 2.4);
    // Dust in front of the band blocks its light.
    float lanes = smoothstep(0.42, 0.72, clouds(drift * 2.4 + warp + 50.0));
    float dust = band * smoothstep(0.25, 0.85, gas) * (1.0 - 0.8 * lanes);
    float glow = dust + bulge * 0.4 * (1.0 - 0.8 * lanes);

    // Mostly old yellow stars towards the middle, bluer away from it.
    vec3 tint = mix(vec3(0.42, 0.52, 0.85), vec3(1.0, 0.76, 0.5), clamp(band * gas + bulge, 0.0, 1.0));
    vec3 light = tint * glow * 0.32;

    // Clouds of gas and dust in the colours they have in long exposures:
    // hydrogen glowing red and pink where stars are born, dust shining blue
    // with the light of young stars near it, and violet where the two mix.
    float hues = clouds(drift * 1.7 + warp * 0.8 + 80.0);
    float wisps = clouds(drift * 0.9 - warp + 300.0);
    float shade = 1.0 - 0.7 * lanes;

    light += vec3(0.95, 0.22, 0.42) * smoothstep(0.52, 0.78, hues) * band * shade * 0.13;
    light += vec3(0.12, 0.5, 0.75) * smoothstep(0.48, 0.24, hues) * halo * gas * shade * 0.17;
    light += vec3(0.42, 0.24, 0.85) * smoothstep(0.5, 0.82, wisps) * halo * shade * 0.1;
    // Where the dust is thick but not quite opaque, it reddens what is
    // behind it.
    light += vec3(0.5, 0.2, 0.08) * lanes * band * gas * 0.1;
    // All of the band is kept faint, so that it is a backdrop to the stars
    // and the earth and not something to look at in itself.
    light *= 0.5;

    // Faint stars: at most one per small square of the screen, somewhere
    // inside it so they do not line up, and many more along the band.
    vec2 square = gl_FragCoord.xy / (7.0 * uPixelRatio);
    vec2 cell = floor(square);
    vec2 spot = 0.15 + 0.7 * vec2(hash(cell + 3.0), hash(cell + 11.0));
    float reach = length((fract(square) - spot) * 7.0);
    float chance = 0.035 + 0.4 * dust;

    if (hash(cell) >= 1.0 - chance) {
      // Most of these twinkle the way stars do through moving air: not to
      // a beat but unevenly, as three waves of different lengths that never
      // line up the same way twice, and each at its own pace.
      float phase = hash(cell + 19.0);
      float pace = uSeconds * (1.4 + phase * 2.6);
      float waver = 0.5 * sin(pace + phase * 40.0)
        + 0.3 * sin(pace * 2.3 + phase * 71.0)
        + 0.2 * sin(pace * 5.1 + phase * 13.0);
      float dip = fract(phase * 7.31) < 0.75 ? 0.45 : 0.12;

      light += vec3(0.85, 0.9, 1.0) * exp(-reach * reach * 2.2) * hash(cell + 7.0) * 0.75
        * (1.0 - dip + dip * waver);
    }

    light += vec3(0.9, 0.95, 1.0) * 0.8
      * (meteor(point, edge, 0.0) + meteor(point, edge, 1.0) + meteor(point, edge, 2.0));

    // The sun is out of sight, past the left edge of the screen, on the
    // side the earth and the moon are lit from. On an upright screen, such
    // as a phone, it is beyond the top left corner instead.
    float wide = smoothstep(0.8, 1.4, uResolution.x / uResolution.y);
    vec2 seat = vec2(-edge.x, edge.y * mix(1.0, 0.5, wide))
      + vec2(-1.0, 1.0) * mix(0.12, 0.0, wide);

    gl_FragColor = expose(light);

    // The earth rises over the bottom of the screen, the moon far behind
    // it. Neither is lit until their maps are there.
    vec2 home = vec2(
      edge.x * mix(${EARTH.upright.toFixed(2)}, ${EARTH.right.toFixed(2)}, wide),
      -edge.y - ${EARTH.below}
    );
    // The moon goes around the earth very slowly, once an hour: over the
    // top of it to the right, and then out of sight behind it.
    float orbit = -uSeconds / 3600.0 * 6.2831853;
    vec2 away = vec2(edge.x * -0.05, -edge.y + 0.52) - home;
    vec2 around = home + mat2(cos(orbit), sin(orbit), -sin(orbit), cos(orbit)) * away;

    // The earth comes up from below the screen, fast at first and ever
    // more slowly as it reaches its place.
    float settled = 1.0 - pow(1.0 - uArrival, 3.0);

    // The moon is lit from where the sun is past the screen, which is a
    // little nearer the camera than the moon is, so that slightly more
    // than the half of it facing the sun shows lit.
    // The earth is nearer the camera than the moon is by far, so its light
    // falls on nearly all of what is seen of the moon.
    vec4 rock = moon(
      point,
      around,
      0.026,
      normalize(vec3(normalize(seat - around), 0.12)),
      normalize(vec3(normalize(home - around) * 0.6, 0.8))
    );
    vec4 globe = earth(point, home - vec2(0.0, 0.32 * (1.0 - settled)), ${EARTH.radius});

    // Both hide the stars behind them from the start, and come out of the
    // dark instead of out of thin air: only their light fades in. The glow
    // of the air past the edge of the earth, which hides nothing, fades in
    // whole.
    gl_FragColor = vec4(rock.rgb * uDawn, rock.a) + gl_FragColor * (1.0 - rock.a);

    globe.rgb *= uDawn;
    globe.a *= mix(uDawn, 1.0, smoothstep(0.85, 1.0, globe.a));
    gl_FragColor = globe + gl_FragColor * (1.0 - globe.a);
  }
`

const starVertex = `
  attribute vec3 aPosition;
  attribute float aSize;
  attribute float aWarmth;
  attribute float aPhase;

  uniform float uSeconds;
  uniform float uFlight;
  uniform float uAspect;
  uniform float uPixelRatio;

  varying float vLight;
  varying float vBright;
  varying vec3 vColor;

  void main() {
    // Stars come towards the camera and start over at the far end.
    float z = fract(aPosition.z - uSeconds / uFlight);
    float depth = mix(0.25, 5.0, z);

    float angle = uSeconds * 0.003;
    mat2 roll = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
    // Fill the long side of the screen, whichever that is.
    vec2 fit = uAspect > 1.0 ? vec2(1.0, uAspect) : vec2(1.0 / uAspect, 1.0);

    gl_Position = vec4(roll * aPosition.xy / depth * fit, 0.0, 1.0);

    // The point is the star and the glow around it.
    float core = aSize * uPixelRatio / depth;

    gl_PointSize = max(core * 6.0, 2.0);

    float twinkle = 0.82 + 0.18 * sin(uSeconds * (0.8 + aPhase * 2.0) + aPhase * 40.0);

    // Fade in at the far end and out just before passing the camera.
    vLight = smoothstep(1.0, 0.75, z) * smoothstep(0.0, 0.08, z) * twinkle
      * clamp(core * 0.9, 0.25, 1.0);
    vBright = smoothstep(2.6, 4.2, aSize);

    // From orange dwarfs over white to hot blue stars.
    vColor = aWarmth < 0.5
      ? mix(vec3(1.0, 0.7, 0.45), vec3(1.0), aWarmth * 2.0)
      : mix(vec3(1.0), vec3(0.68, 0.8, 1.0), aWarmth * 2.0 - 1.0);
  }
`

const starFragment = `
  precision highp float;


  varying float vLight;
  varying float vBright;
  varying vec3 vColor;

  ${exposure}

  void main() {
    vec2 point = (gl_PointCoord - 0.5) * 2.0;
    float distance = dot(point, point);

    // A sharp core with a soft glow, and on the brightest stars the spikes
    // a telescope draws.
    float glow = exp(-distance * 22.0) + 0.3 * exp(-distance * 5.0);
    float spikes = exp(-abs(point.x) * 26.0) * exp(-abs(point.y) * 3.5)
      + exp(-abs(point.y) * 26.0) * exp(-abs(point.x) * 3.5);

    gl_FragColor = expose(vColor * vLight * (glow + spikes * vBright * 0.6));
  }
`

// How many times a canvas that lost its context is replaced by a new one,
// so that a graphics card that keeps failing is left alone in the end.
const ATTEMPTS = 3

function link(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()!

  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type)!

    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    gl.attachShader(program, shader)
  }

  gl.linkProgram(program)

  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

// The night sky behind the not found page, drawn with WebGL: a field of
// stars the camera drifts through, and the far sky, the earth and the moon
// as one shader over the whole screen. Without WebGL the canvas simply stays empty.
export default function Starfield({ className }: StarfieldProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  // A canvas only ever has the one context, and a context that is lost
  // stays lost. So when that happens the canvas is replaced by a new one,
  // which this counts, and the sky is set up again on that.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', { antialias: false })

    if (!canvas || !gl) return

    function replace() {
      setAttempt((attempt) => Math.min(attempt + 1, ATTEMPTS))
    }

    // The context is already lost when this runs again on a canvas it has
    // run on before, as it does when the code is replaced while developing:
    // the clean up below gave the context up.
    if (gl.isContextLost()) return replace()

    const skyProgram = link(
      gl,
      'attribute vec2 aCorner; void main() { gl_Position = vec4(aCorner, 0.0, 1.0); }',
      sky,
    )
    const starProgram = link(gl, starVertex, starFragment)

    if (!skyProgram || !starProgram) return

    // One triangle that covers the screen.
    const corners = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )

    // Six numbers per star: where it is, how large, how warm its colour is
    // and where it is in its twinkle.
    const stars = new Float32Array(STARS * 6)

    for (let index = 0; index < STARS; index++) {
      stars[index * 6] = (Math.random() * 2 - 1) * 5.5
      stars[index * 6 + 1] = (Math.random() * 2 - 1) * 5.5
      stars[index * 6 + 2] = Math.random()
      // Most stars are faint, a few are bright.
      stars[index * 6 + 3] = 0.5 + Math.pow(Math.random(), 7) * 4
      stars[index * 6 + 4] = Math.random()
      stars[index * 6 + 5] = Math.random()
    }

    const points = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, points)
    gl.bufferData(gl.ARRAY_BUFFER, stars, gl.STATIC_DRAW)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // The maps each keep a texture slot of their own. The earth and the
    // moon are left out until all of them have arrived.
    const maps = {
      uDay: earthDay,
      uNight: earthNight,
      uClouds: earthClouds,
      uMoon: moonSurface,
    }
    const sharpest = gl.getExtension('EXT_texture_filter_anisotropic')
    let waiting = Object.keys(maps).length
    let arrived = 0
    let gone = false

    Object.values(maps).forEach((source, slot) => {
      const image = new Image()

      image.onload = () => {
        if (gone) return

        gl.activeTexture(gl.TEXTURE0 + slot)
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
        // Maps have north at the top, textures start at the bottom.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR,
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        // Keeps the ground sharp where it is seen at a low angle.
        if (sharpest) {
          gl.texParameterf(
            gl.TEXTURE_2D,
            sharpest.TEXTURE_MAX_ANISOTROPY_EXT,
            gl.getParameter(sharpest.MAX_TEXTURE_MAX_ANISOTROPY_EXT),
          )
        }

        if (--waiting == 0) {
          arrived = performance.now()
          // A sky that holds still is not drawn again by itself.
          if (still.matches) draw()
        }
      }

      image.src = source
    })

    gl.useProgram(skyProgram)
    Object.keys(maps).forEach((name, slot) => {
      gl.uniform1i(gl.getUniformLocation(skyProgram, name), slot)
    })

    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = performance.now()
    let frame = 0

    // The browser can take the context away at any time, when the graphics
    // card is reset or too much is asked of it.
    function lost() {
      gone = true
      cancelAnimationFrame(frame)
      replace()
    }

    canvas.addEventListener('webglcontextlost', lost)

    // The earth can be turned by dragging it, with a mouse or a finger, and
    // spun by letting go of it while moving. How it is turned, and the spin
    // it has, in radians per second to the right and down. And where the
    // pointer was last while it is held.
    const earth: {
      orientation: ArrayLike<number>
      spin: { right: number; down: number }
    } = { orientation: globe(), spin: { right: 0, down: 0 } }
    let held: { x: number; y: number; at: number } | null = null
    let drawn = start

    // The short side of the screen, which the earth is measured in.
    function side() {
      return Math.min(canvas!.clientWidth, canvas!.clientHeight)
    }

    // Where on the screen something is, as both a pointer and a finger say.
    interface Place {
      clientX: number
      clientY: number
    }

    // How large the earth is on the screen.
    function radius() {
      return EARTH.radius * side()
    }

    // Whether the earth is there.
    function over(place: Place) {
      const [width, height] = [canvas!.clientWidth, canvas!.clientHeight]

      return (
        Math.hypot(
          place.clientX - width * (0.5 + aside(width, height) * 0.5),
          place.clientY - height - EARTH.below * side(),
        ) < radius()
      )
    }

    // Whether it can be taken hold of there: not through a link.
    function free(place: Place, target: EventTarget | null) {
      return (
        !(target instanceof Element && target.closest('a, button')) &&
        over(place)
      )
    }

    function hold(place: Place, at: number) {
      held = { x: place.clientX, y: place.clientY, at }
      earth.spin = { right: 0, down: 0 }
    }

    function turnTo(place: Place, at: number) {
      if (!held) return

      // The ground under the pointer moves as far as the pointer does.
      const reach = radius()
      const right = (place.clientX - held.x) / reach
      const down = (place.clientY - held.y) / reach
      const delta = Math.max(at - held.at, 1) / 1000

      earth.orientation = turned(earth.orientation, right, down)
      // Average over the last few moves, since a single one is jittery.
      earth.spin = {
        right: limit(earth.spin.right * 0.6 + (right / delta) * 0.4),
        down: limit(earth.spin.down * 0.6 + (down / delta) * 0.4),
      }
      held = { x: place.clientX, y: place.clientY, at }

      // A sky that holds still is not drawn again by itself.
      if (still.matches) draw()
    }

    function letGo(at: number) {
      if (!held) return

      if (at - held.at > REST) earth.spin = { right: 0, down: 0 }

      held = null
    }

    // A mouse or a pen drags the earth through pointer events. A finger
    // does it through touch events further down, since only those can keep
    // the page from scrolling instead.
    function grab(event: PointerEvent) {
      if (event.pointerType == 'touch' || event.button != 0) return

      if (!free(event, event.target)) return

      // Keeps the drag from selecting the text of the page.
      event.preventDefault()
      hold(event, event.timeStamp)
      document.documentElement.style.cursor = 'grabbing'
    }

    function drag(event: PointerEvent) {
      if (event.pointerType == 'touch') return

      if (held) turnTo(event, event.timeStamp)
      else document.documentElement.style.cursor = over(event) ? 'grab' : ''
    }

    function release(event: PointerEvent) {
      if (event.pointerType == 'touch' || !held) return

      letGo(event.timeStamp)
      document.documentElement.style.cursor = over(event) ? 'grab' : ''
    }

    function touch(event: TouchEvent) {
      const finger = event.touches[0]
      // Two fingers are zooming the page, not turning anything.
      if (event.touches.length == 1 && free(finger, event.target)) {
        hold(finger, event.timeStamp)
      } else {
        held = null
      }
    }

    function swipe(event: TouchEvent) {
      if (!held) return

      // The page stays where it is while the earth is being turned.
      event.preventDefault()
      turnTo(event.touches[0], event.timeStamp)
    }

    function lift(event: TouchEvent) {
      letGo(event.timeStamp)
    }

    window.addEventListener('pointerdown', grab)
    window.addEventListener('pointermove', drag)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    window.addEventListener('touchstart', touch, { passive: true })
    window.addEventListener('touchmove', swipe, { passive: false })
    window.addEventListener('touchend', lift)
    window.addEventListener('touchcancel', lift)

    function attribute(
      program: WebGLProgram,
      name: string,
      size: number,
      stride: number,
      offset: number,
    ) {
      const location = gl!.getAttribLocation(program, name)

      gl!.enableVertexAttribArray(location)
      gl!.vertexAttribPointer(location, size, gl!.FLOAT, false, stride, offset)
    }

    function uniforms(program: WebGLProgram, values: Record<string, number>) {
      for (const [name, value] of Object.entries(values)) {
        gl!.uniform1f(gl!.getUniformLocation(program, name), value)
      }
    }

    function draw() {
      const ratio = Math.min(window.devicePixelRatio, 2)
      const width = Math.round(canvas!.clientWidth * ratio)
      const height = Math.round(canvas!.clientHeight * ratio)

      if (canvas!.width != width || canvas!.height != height) {
        canvas!.width = width
        canvas!.height = height
        gl!.viewport(0, 0, width, height)
      }

      // Left alone after a throw, the earth spins on and slows down, until
      // only the turning it always does is left.
      const now = performance.now()
      const elapsed = Math.min((now - drawn) / 1000, 0.05)

      drawn = now

      const { right, down } = earth.spin

      if (!held && Math.abs(right) + Math.abs(down) >= 0.0005) {
        const slowed = Math.exp(-FRICTION * elapsed)

        earth.orientation = turned(
          earth.orientation,
          right * elapsed,
          down * elapsed,
        )
        earth.spin = { right: right * slowed, down: down * slowed }
      }

      const shared = {
        uSeconds: (performance.now() - start) / 1000,
        uPixelRatio: ratio,
      }

      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)

      // The stars go first, so that the planet covers the ones behind it.
      gl!.useProgram(starProgram)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, points)
      attribute(starProgram!, 'aPosition', 3, 24, 0)
      attribute(starProgram!, 'aSize', 1, 24, 12)
      attribute(starProgram!, 'aWarmth', 1, 24, 16)
      attribute(starProgram!, 'aPhase', 1, 24, 20)
      uniforms(starProgram!, {
        ...shared,
        uFlight: FLIGHT,
        uAspect: width / height,
      })
      gl!.drawArrays(gl!.POINTS, 0, STARS)

      gl!.useProgram(skyProgram)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, corners)
      attribute(skyProgram!, 'aCorner', 2, 0, 0)
      uniforms(skyProgram!, {
        ...shared,
        uDawn:
          waiting || still.matches
            ? Number(!waiting)
            : Math.min((performance.now() - arrived) / 1000 / DAWN, 1),
        uArrival:
          waiting || still.matches
            ? Number(!waiting)
            : Math.min((performance.now() - arrived) / 1000 / ARRIVAL, 1),
        uHeld: Number(Boolean(held)),
      })
      gl!.uniform2f(
        gl!.getUniformLocation(skyProgram!, 'uResolution'),
        width,
        height,
      )
      gl!.uniformMatrix3fv(
        gl!.getUniformLocation(skyProgram!, 'uGlobe'),
        false,
        Float32Array.from(earth.orientation),
      )
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)

      // A sky that holds still needs to be drawn only once.
      if (!still.matches) frame = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      gone = true
      cancelAnimationFrame(frame)
      window.removeEventListener('pointerdown', grab)
      window.removeEventListener('pointermove', drag)
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
      window.removeEventListener('touchstart', touch)
      window.removeEventListener('touchmove', swipe)
      window.removeEventListener('touchend', lift)
      window.removeEventListener('touchcancel', lift)
      document.documentElement.style.cursor = ''
      // Giving the context up here is not the browser taking it away.
      canvas.removeEventListener('webglcontextlost', lost)
      // Browsers only allow a handful of WebGL contexts at a time.
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [attempt])

  return <canvas key={attempt} ref={ref} className={className} />
}
