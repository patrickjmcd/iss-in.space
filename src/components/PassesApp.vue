<template>
  <div>
    <div class="flex flex-wrap items-start justify-between mb4">
      <div>
        <p class="f7 ttu tracked mb1" style="color:var(--text-3)">Passes for</p>
        <p class="f3 fw7 mb1" style="color:var(--text-1)">{{ dlat }}, {{ dlng }}</p>
        <p class="f6 mb0" style="color:var(--text-2)">
          {{ tz.name }} <span style="color:var(--text-3)">(UTC{{ tz.offset }})</span>
        </p>
      </div>
      <a href="/" class="f6 dim mt2 no-underline" style="color:var(--text-3)">&larr; Change location</a>
    </div>

    <div class="controls-bar flex flex-wrap items-center mb3 pv2 ph3">
      <span class="f7 ttu tracked mr3" style="color:var(--text-3)">Display</span>
      <label class="f6 mr4 flex items-center">
        <input type="checkbox" v-model="display.degrees" class="mr1"> Degrees
      </label>
      <label class="f6 flex items-center">
        <input type="checkbox" v-model="display.hour24"> 24h time
      </label>
    </div>

    <div class="flex flex-wrap items-center mb2 ph3 pb2" style="gap:0.75rem">
      <span class="f7 ttu tracked" style="color:var(--text-3)">Max elevation</span>
      <span class="f7"><span class="elev-excellent">&#9632;</span> <span style="color:var(--text-2)">Excellent &mdash; &ge;60&deg;</span></span>
      <span class="f7"><span class="elev-good">&#9632;</span> <span style="color:var(--text-2)">Good &mdash; &ge;30&deg;</span></span>
      <span class="f7"><span class="elev-avg">&#9632;</span> <span style="color:var(--text-2)">Fair &mdash; &ge;10&deg;</span></span>
      <span class="f7"><span class="elev-low">&#9632;</span> <span style="color:var(--text-2)">Low &mdash; &lt;10&deg;</span></span>
    </div>
    <p class="f7 mb4 ph1" style="color:var(--text-3)">Higher elevation = brighter &amp; easier to see. Face the Rise direction when the pass starts, then follow it across the sky. The ISS looks like a bright, fast-moving star &mdash; no telescope needed.</p>

    <div v-if="Object.keys(groupedPredictions).length === 0" class="tc pv5 f5" style="color:var(--text-2)">
      No passes in the next 5 days.
    </div>

    <div v-for="(passes, date) in groupedPredictions" :key="date" class="mb4">
      <p class="date-header mb2">{{ date }}</p>

      <!-- Mobile cards -->
      <div class="dn-ns">
        <div v-for="(pred, i) in passes" :key="i" class="pass-card mb2 pa3 br2" style="background:var(--surface);border:1px solid var(--border)">
          <div class="flex items-center justify-between mb2">
            <span class="f4 fw7" style="color:var(--text-1)">{{ pred.rise.time }}</span>
            <span class="f6" style="color:var(--text-3)">{{ pred.length_mins }}</span>
          </div>
          <div class="flex items-center mb2">
            <span class="f2 fw7 mr3" :class="elevationClass(pred.culminate.degrees)">{{ pred.culminate.degrees }}&deg;</span>
            <div>
              <div class="f7 ttu tracked mb1" style="color:var(--text-3)">Max elevation &mdash; <span :class="elevationClass(pred.culminate.degrees)">{{ elevationLabel(pred.culminate.degrees) }}</span></div>
              <div class="f6" style="color:var(--text-2)">
                <span v-if="!display.degrees">{{ pred.culminate.direction }}</span>
                <span v-else>{{ pred.culminate.azimuth }}&deg;</span>
                &nbsp;&middot;&nbsp;{{ pred.culminate.distance }} km away
              </div>
            </div>
          </div>
          <button v-if="isFuturePass(pred)" class="ar-launch-btn" @click="openAR(pred)">
            &#9685; Point me there
          </button>
          <div class="flex f7 pt2" style="color:var(--text-3);border-top:1px solid var(--border)">
            <div class="flex-auto">
              <div class="ttu tracked mb1">Rise</div>
              <div style="color:var(--text-2)">{{ pred.rise.time }}</div>
              <div>
                <span v-if="!display.degrees">Face <strong>{{ pred.rise.direction }}</strong></span>
                <span v-else>{{ pred.rise.azimuth }}&deg;</span>
              </div>
            </div>
            <div class="flex-auto">
              <div class="ttu tracked mb1">Peak</div>
              <div style="color:var(--text-2)">{{ pred.culminate.time }}</div>
            </div>
            <div class="flex-auto">
              <div class="ttu tracked mb1">Disappears</div>
              <div style="color:var(--text-2)">{{ pred.set.time }}</div>
              <div>
                <span v-if="!display.degrees">{{ pred.set.direction }}</span>
                <span v-else>{{ pred.set.azimuth }}&deg;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <div class="dn db-ns">
        <table class="passes-table">
          <thead>
            <tr class="f7 tl">
              <th class="pb2 pr3 fw4">Duration</th>
              <th class="pb2 pr3 fw4" colspan="2">Rise</th>
              <th class="pb2 pr3 fw4" colspan="4">Peak</th>
              <th class="pb2 pr3 fw4" colspan="2">Set</th>
            </tr>
            <tr class="f7 tl" style="color:var(--text-3)">
              <th class="pb2 pr3 fw4"></th>
              <th class="pb2 pr3 fw4">Time</th>
              <th class="pb2 pr3 fw4">Face this dir</th>
              <th class="pb2 pr3 fw4">Time</th>
              <th class="pb2 pr3 fw4">Max elev</th>
              <th class="pb2 pr3 fw4">Dir</th>
              <th class="pb2 pr3 fw4">Range (km)</th>
              <th class="pb2 pr3 fw4">Time</th>
              <th class="pb2 pr3 fw4">Dir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pred, i) in passes" :key="i" class="f5">
              <td class="pv2 pr3 f6" style="color:var(--text-2)">{{ pred.length_mins }}</td>
              <td class="pv2 pr3">{{ pred.rise.time }}</td>
              <td class="pv2 pr3 f6" style="color:var(--text-2)">
                <span v-if="!display.degrees">{{ pred.rise.direction }}</span>
                <span v-else>{{ pred.rise.azimuth }}&deg;</span>
              </td>
              <td class="pv2 pr3">{{ pred.culminate.time }}</td>
              <td class="pv2 pr3 fw7" :class="elevationClass(pred.culminate.degrees)">
                {{ pred.culminate.degrees }}&deg;
              </td>
              <td class="pv2 pr3 f6" style="color:var(--text-2)">
                <span v-if="!display.degrees">{{ pred.culminate.direction }}</span>
                <span v-else>{{ pred.culminate.azimuth }}&deg;</span>
              </td>
              <td class="pv2 pr3 f6" style="color:var(--text-2)">{{ pred.culminate.distance }}</td>
              <td class="pv2 pr3">{{ pred.set.time }}</td>
              <td class="pv2 pr3 f6" style="color:var(--text-2)">
                <span v-if="!display.degrees">{{ pred.set.direction }}</span>
                <span v-else>{{ pred.set.azimuth }}&deg;</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- AR Overlay -->
    <div v-if="ar.active" class="ar-overlay">
      <video ref="arVideo" class="ar-video" autoplay playsinline muted></video>
      <canvas ref="arCanvas" class="ar-canvas"></canvas>

      <div class="ar-top">
        <div v-if="ar.pass" class="ar-pass-info">
          <span class="ar-pass-time">{{ ar.pass.rise.time }} rise</span>
          <span :class="elevationClass(ar.pass.culminate.degrees)" class="ar-pass-quality">
            {{ elevationLabel(ar.pass.culminate.degrees) }} &middot; {{ ar.pass.culminate.degrees }}&deg; max
          </span>
        </div>
        <button class="ar-close-btn" @click="closeAR">&#10005;</button>
      </div>

      <div v-if="ar.needsIOSPermission && !ar.error" class="ar-prompt">
        <p class="ar-prompt-text">Tap below to enable the compass</p>
        <button class="ar-prompt-btn" @click="requestIOSOrientationPermission">Enable Compass</button>
      </div>

      <div v-if="ar.error" class="ar-prompt">
        <p class="ar-prompt-text">{{ ar.error }}</p>
        <button class="ar-prompt-btn" @click="closeAR">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';

const props = defineProps<{
  predictions: any[];
  dlat: string;
  dlng: string;
  lat: number;
  lng: number;
}>();

const display = ref({ hour24: false, degrees: false });
const ar = ref({
  active: false,
  pass: null as any,
  heading: null as number | null,
  tilt: null as number | null,
  stream: null as MediaStream | null,
  animFrame: null as number | null,
  error: null as string | null,
  needsIOSPermission: false,
});

const arVideo = ref<HTMLVideoElement | null>(null);
const arCanvas = ref<HTMLCanvasElement | null>(null);
let arOrientHandler: ((e: DeviceOrientationEvent) => void) | null = null;

const tz = computed(() => {
  const offset = new Date().getTimezoneOffset() / -60;
  return {
    name: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: offset >= 0 ? `+${offset}` : String(offset),
  };
});

const localizedPredictions = computed(() => {
  const hour12 = !display.value.hour24;
  return JSON.parse(JSON.stringify(props.predictions)).map((p: any) => {
    p.date = new Date(p.rise.time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    p.rise.isoTime = p.rise.time;
    p.rise.time = new Date(p.rise.time).toLocaleTimeString([], { hour12, hour: '2-digit', minute: '2-digit' });
    p.culminate.time = new Date(p.culminate.time).toLocaleTimeString([], { hour12, hour: '2-digit', minute: '2-digit' });
    p.set.time = new Date(p.set.time).toLocaleTimeString([], { hour12, hour: '2-digit', minute: '2-digit' });
    return p;
  });
});

const groupedPredictions = computed(() => {
  const groups: Record<string, any[]> = {};
  localizedPredictions.value.forEach((p: any) => {
    if (!groups[p.date]) groups[p.date] = [];
    groups[p.date].push(p);
  });
  return groups;
});

function elevationClass(deg: number) {
  if (deg >= 60) return 'elev-excellent';
  if (deg >= 30) return 'elev-good';
  if (deg >= 10) return 'elev-avg';
  return 'elev-low';
}

function elevationLabel(deg: number) {
  if (deg >= 60) return 'Excellent';
  if (deg >= 30) return 'Good';
  if (deg >= 10) return 'Fair';
  return 'Low';
}

function isFuturePass(pred: any) {
  return pred.rise.isoTime && new Date(pred.rise.isoTime) > new Date();
}

async function openAR(pred: any) {
  ar.value.pass = pred;
  ar.value.active = true;
  ar.value.error = null;
  ar.value.heading = null;
  ar.value.tilt = null;
  ar.value.needsIOSPermission = false;
  await nextTick();
  startARCamera();
  startAROrientation();
  arLoop();
}

function closeAR() {
  ar.value.active = false;
  if (ar.value.stream) {
    ar.value.stream.getTracks().forEach(t => t.stop());
    ar.value.stream = null;
  }
  if (ar.value.animFrame) {
    cancelAnimationFrame(ar.value.animFrame);
    ar.value.animFrame = null;
  }
  if (arOrientHandler) {
    window.removeEventListener('deviceorientationabsolute', arOrientHandler as any, true);
    window.removeEventListener('deviceorientation', arOrientHandler as any, true);
    arOrientHandler = null;
  }
  ar.value.pass = null;
}

function startARCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    ar.value.error = 'Camera not supported on this device.';
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
    .then(stream => {
      ar.value.stream = stream;
      if (arVideo.value) arVideo.value.srcObject = stream;
    })
    .catch(() => {
      ar.value.error = 'Camera permission denied. Please allow camera access to use AR.';
    });
}

function startAROrientation() {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    ar.value.needsIOSPermission = true;
    return;
  }
  startOrientListeners();
}

function requestIOSOrientationPermission() {
  (DeviceOrientationEvent as any).requestPermission()
    .then((state: string) => {
      if (state === 'granted') {
        ar.value.needsIOSPermission = false;
        startOrientListeners();
      } else {
        ar.value.error = 'Compass permission denied.';
      }
    })
    .catch(() => {
      ar.value.error = 'Could not request compass permission.';
    });
}

function startOrientListeners() {
  arOrientHandler = (e: DeviceOrientationEvent) => handleOrientation(e);
  window.addEventListener('deviceorientationabsolute', arOrientHandler as any, true);
  window.addEventListener('deviceorientation', arOrientHandler as any, true);
}

function handleOrientation(e: DeviceOrientationEvent) {
  const ev = e as any;
  if (ev.webkitCompassHeading !== undefined && ev.webkitCompassHeading !== null) {
    ar.value.heading = ev.webkitCompassHeading;
  } else if (e.alpha !== null) {
    ar.value.heading = (360 - e.alpha!) % 360;
  }
  if (e.beta !== null) {
    ar.value.tilt = e.beta! - 90;
  }
}

function arLoop() {
  if (!ar.value.active) return;
  const canvas = arCanvas.value;
  if (canvas) {
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    drawAR(canvas.getContext('2d')!, canvas.width, canvas.height);
  }
  ar.value.animFrame = requestAnimationFrame(() => arLoop());
}

function drawAR(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const pass = ar.value.pass;
  if (!pass) return;

  const COMPASS_H = 72;
  const viewH = h - COMPASS_H;
  const heading = ar.value.heading;
  const tilt = ar.value.tilt;
  const targetAz = pass.rise.azimuth;
  const targetEl = 0;

  drawCompassStrip(ctx, w, h, COMPASS_H, heading, targetAz);

  if (heading === null) {
    drawLabel(ctx, w / 2, viewH / 2, 'Waiting for compass…', 'rgba(255,255,255,0.7)', '16px');
    return;
  }

  const HFOV = 50, VFOV = 70;
  let hDiff = targetAz - heading;
  if (hDiff > 180) hDiff -= 360;
  if (hDiff < -180) hDiff += 360;
  const effectiveTilt = tilt !== null ? tilt : 0;
  const vDiff = targetEl - effectiveTilt;

  const xNorm = hDiff / (HFOV / 2);
  const yNorm = -vDiff / (VFOV / 2);

  const isAligned = Math.abs(hDiff) < 5 && (tilt === null || Math.abs(vDiff) < 5);
  const inView = Math.abs(xNorm) < 1.0 && Math.abs(yNorm) < 1.0;
  const cx = w / 2 + xNorm * (w / 2);
  const cy = viewH / 2 + yNorm * (viewH / 2);

  if (inView) {
    drawReticle(ctx, cx, cy, isAligned);
  } else {
    drawArrow(ctx, w, viewH, xNorm, yNorm);
  }

  const textY = viewH - 48;
  if (isAligned) {
    drawLabel(ctx, w / 2, textY, '✓  Pointed at rise location', '#5fd4f4', '15px');
  } else {
    const parts: string[] = [];
    if (Math.abs(hDiff) >= 5)
      parts.push(hDiff > 0 ? `Rotate right ${Math.round(hDiff)}°` : `Rotate left ${Math.round(-hDiff)}°`);
    if (tilt !== null && Math.abs(vDiff) >= 5)
      parts.push(vDiff > 0 ? `Tilt up ${Math.round(vDiff)}°` : `Tilt down ${Math.round(-vDiff)}°`);
    if (parts.length)
      drawLabel(ctx, w / 2, textY, parts.join('  ·  '), 'rgba(255,255,255,0.9)', '14px');
  }
}

function drawCompassStrip(ctx: CanvasRenderingContext2D, w: number, h: number, COMPASS_H: number, heading: number | null, targetAz: number) {
  const y = h - COMPASS_H;
  const PX = w / 80;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, y, w, COMPASS_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();

  if (heading === null) return;

  const cardinals: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  for (let az = 0; az < 360; az += 5) {
    let diff = az - heading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const x = w / 2 + diff * PX;
    if (x < 0 || x > w) continue;
    const isCard = az % 45 === 0, isMajor = az % 10 === 0;
    ctx.fillStyle = isCard ? 'rgba(255,255,255,0.75)' : (isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)');
    ctx.fillRect(x - 0.5, y + 6, 1, isCard ? 14 : (isMajor ? 9 : 5));
    if (isCard) {
      ctx.fillStyle = az === 0 ? '#ff7b7b' : 'rgba(255,255,255,0.75)';
      ctx.font = '11px -apple-system,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cardinals[az], x, y + 38);
    }
  }

  let td = targetAz - heading;
  if (td > 180) td -= 360;
  if (td < -180) td += 360;
  const tx = w / 2 + td * PX;
  if (tx >= 8 && tx <= w - 8) {
    ctx.fillStyle = '#5fd4f4';
    ctx.beginPath();
    ctx.moveTo(tx, y + 4); ctx.lineTo(tx - 7, y + 17); ctx.lineTo(tx + 7, y + 17);
    ctx.closePath(); ctx.fill();
    ctx.font = 'bold 10px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ISS', tx, y + COMPASS_H - 6);
  } else {
    ctx.fillStyle = '#5fd4f4';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(td < 0 ? '◀' : '▶', td < 0 ? 24 : w - 24, y + COMPASS_H / 2 + 6);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(w / 2 - 1, y, 2, 6);
}

function drawReticle(ctx: CanvasRenderingContext2D, cx: number, cy: number, isAligned: boolean) {
  const R = 38;
  const color = isAligned ? '#5fd4f4' : 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = color;
  ctx.lineWidth = isAligned ? 2.5 : 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const gap = 10, ext = 18;
  const lines: [number, number, number, number][] = [
    [cx - R - ext, cy, cx - R - gap, cy],
    [cx + R + gap, cy, cx + R + ext, cy],
    [cx, cy - R - ext, cx, cy - R - gap],
    [cx, cy + R + gap, cx, cy + R + ext],
  ];
  ctx.beginPath();
  lines.forEach(l => { ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); });
  ctx.stroke();
  if (isAligned) {
    ctx.fillStyle = '#5fd4f4';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(95,212,244,0.25)';
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, w: number, viewH: number, xNorm: number, yNorm: number) {
  const angle = Math.atan2(yNorm, xNorm);
  const margin = 70;
  const dist = Math.min(w, viewH) / 2 - margin;
  ctx.save();
  ctx.translate(w / 2, viewH / 2);
  ctx.rotate(angle);
  ctx.strokeStyle = 'rgba(95,212,244,0.9)';
  ctx.fillStyle = 'rgba(95,212,244,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(dist - 18, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dist, 0); ctx.lineTo(dist - 16, -9); ctx.lineTo(dist - 16, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, size: string) {
  ctx.font = `${size} -apple-system,BlinkMacSystemFont,sans-serif`;
  ctx.textAlign = 'center';
  const mw = ctx.measureText(text).width;
  const pad = 12;
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  ctx.fillRect(x - mw / 2 - pad, y - 20, mw + pad * 2, 30);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
</script>
