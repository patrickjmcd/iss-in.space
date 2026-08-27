<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <p class="text-xs uppercase tracking-wider text-muted-foreground mb-1">Passes for</p>
        <p class="text-2xl font-bold mb-1">{{ dlat }}, {{ dlng }}</p>
        <p class="text-sm text-muted-foreground">
          {{ tz.name }} <span class="opacity-70">(UTC{{ tz.offset }})</span>
        </p>
      </div>
      <Button as="a" href="/" variant="ghost" size="sm" class="text-muted-foreground -mr-3">&larr; Change location</Button>
    </div>

    <Card class="mb-4 py-3">
      <CardContent class="flex flex-wrap items-center gap-6">
        <span class="text-xs uppercase tracking-wider text-muted-foreground">Display</span>
        <Label class="flex items-center gap-2 text-sm font-normal cursor-pointer">
          <Switch v-model="display.degrees" size="sm" />
          Degrees
        </Label>
        <Label class="flex items-center gap-2 text-sm font-normal cursor-pointer">
          <Switch v-model="display.hour24" size="sm" />
          24h time
        </Label>
      </CardContent>
    </Card>

    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="text-xs uppercase tracking-wider text-muted-foreground mr-1">Max elevation</span>
      <Badge variant="outline" class="text-elev-excellent border-elev-excellent/40">Excellent &mdash; &ge;60&deg;</Badge>
      <Badge variant="outline" class="text-elev-good border-elev-good/40">Good &mdash; &ge;30&deg;</Badge>
      <Badge variant="outline" class="text-elev-avg border-elev-avg/40">Fair &mdash; &ge;10&deg;</Badge>
      <Badge variant="outline" class="text-elev-low border-elev-low/40">Low &mdash; &lt;10&deg;</Badge>
    </div>
    <p class="text-xs text-muted-foreground mb-8">Higher elevation = brighter &amp; easier to see. Face the Rise direction when the pass starts, then follow it across the sky. The ISS looks like a bright, fast-moving star &mdash; no telescope needed.</p>

    <div v-if="Object.keys(groupedPredictions).length === 0" class="text-center py-16 text-sm text-muted-foreground">
      No passes in the next 5 days.
    </div>

    <div v-for="(passes, date) in groupedPredictions" :key="date" class="mb-8">
      <p class="text-sm font-semibold mb-2 pb-1 border-b">{{ date }}</p>

      <!-- Mobile cards -->
      <div class="grid gap-2 md:hidden">
        <Card v-for="(pred, i) in passes" :key="i" class="py-3">
          <CardContent class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold">{{ pred.rise.time }}</span>
              <span class="text-sm text-muted-foreground">{{ pred.length_mins }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-3xl font-bold" :class="elevationClass(pred.culminate.degrees)">{{ pred.culminate.degrees }}&deg;</span>
              <div>
                <div class="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Max elevation
                  <Badge variant="outline" :class="elevationClass(pred.culminate.degrees)" class="normal-case tracking-normal">{{ elevationLabel(pred.culminate.degrees) }}</Badge>
                </div>
                <div class="text-sm text-muted-foreground">
                  <span v-if="!display.degrees">{{ pred.culminate.direction }}</span>
                  <span v-else>{{ pred.culminate.azimuth }}&deg;</span>
                  &nbsp;&middot;&nbsp;{{ pred.culminate.distance }} km away
                </div>
              </div>
            </div>
            <Button v-if="isFuturePass(pred)" class="w-full" @click="openAR(pred)">
              &#9685; Point me there
            </Button>
            <Separator />
            <div class="flex text-xs text-muted-foreground pt-1">
              <div class="flex-1">
                <div class="uppercase tracking-wider mb-1">Rise</div>
                <div class="text-foreground">{{ pred.rise.time }}</div>
                <div>
                  <span v-if="!display.degrees">Face <strong class="text-foreground">{{ pred.rise.direction }}</strong></span>
                  <span v-else>{{ pred.rise.azimuth }}&deg;</span>
                </div>
              </div>
              <div class="flex-1">
                <div class="uppercase tracking-wider mb-1">Peak</div>
                <div class="text-foreground">{{ pred.culminate.time }}</div>
              </div>
              <div class="flex-1">
                <div class="uppercase tracking-wider mb-1">Disappears</div>
                <div class="text-foreground">{{ pred.set.time }}</div>
                <div>
                  <span v-if="!display.degrees">{{ pred.set.direction }}</span>
                  <span v-else>{{ pred.set.azimuth }}&deg;</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Desktop table -->
      <Card class="hidden md:block py-0 gap-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Duration</TableHead>
              <TableHead colspan="2">Rise</TableHead>
              <TableHead colspan="4">Peak</TableHead>
              <TableHead colspan="2">Set</TableHead>
            </TableRow>
            <TableRow class="text-muted-foreground">
              <TableHead></TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Face this dir</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Max elev</TableHead>
              <TableHead>Dir</TableHead>
              <TableHead>Range (km)</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Dir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(pred, i) in passes" :key="i">
              <TableCell class="text-sm text-muted-foreground">{{ pred.length_mins }}</TableCell>
              <TableCell class="font-medium">{{ pred.rise.time }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <span v-if="!display.degrees">{{ pred.rise.direction }}</span>
                <span v-else>{{ pred.rise.azimuth }}&deg;</span>
              </TableCell>
              <TableCell class="font-medium">{{ pred.culminate.time }}</TableCell>
              <TableCell class="font-bold" :class="elevationClass(pred.culminate.degrees)">{{ pred.culminate.degrees }}&deg;</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <span v-if="!display.degrees">{{ pred.culminate.direction }}</span>
                <span v-else>{{ pred.culminate.azimuth }}&deg;</span>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">{{ pred.culminate.distance }}</TableCell>
              <TableCell class="font-medium">{{ pred.set.time }}</TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <span v-if="!display.degrees">{{ pred.set.direction }}</span>
                <span v-else>{{ pred.set.azimuth }}&deg;</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>

    <!-- AR Overlay -->
    <div v-if="ar.active" class="ar-overlay">
      <video ref="arVideo" class="ar-video" autoplay playsinline muted></video>
      <canvas ref="arCanvas" class="ar-canvas"></canvas>

      <div class="ar-top">
        <div v-if="ar.pass" class="ar-pass-info">
          <span class="ar-pass-time">{{ ar.pass.rise.time }} rise</span>
          <Badge variant="outline" :class="elevationClass(ar.pass.culminate.degrees)" class="bg-black/40 backdrop-blur-sm">
            {{ elevationLabel(ar.pass.culminate.degrees) }} &middot; {{ ar.pass.culminate.degrees }}&deg; max
          </Badge>
        </div>
        <Button variant="secondary" size="icon" class="rounded-full size-8" @click="closeAR">&#10005;</Button>
      </div>

      <div v-if="ar.needsIOSPermission && !ar.error" class="ar-prompt">
        <p class="ar-prompt-text">Tap below to enable the compass</p>
        <Button @click="requestIOSOrientationPermission">Enable Compass</Button>
      </div>

      <div v-if="ar.error" class="ar-prompt">
        <p class="ar-prompt-text">{{ ar.error }}</p>
        <Button @click="closeAR">Close</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
  if (deg >= 60) return 'text-elev-excellent';
  if (deg >= 30) return 'text-elev-good';
  if (deg >= 10) return 'text-elev-avg';
  return 'text-elev-low';
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
