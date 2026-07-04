import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-premium-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './premium-dashboard.component.html',
  styleUrls: ['./premium-dashboard.component.scss']
})
export class PremiumDashboardComponent implements AfterViewInit {
  recentEvents = [
    { tx: '#TX_8829', status: 'Paid', statusClass: 'status-paid', desc: 'Table 12 - $145.00', time: '14:22:10 UTC' },
    { tx: '#TX_8830', status: 'Pending', statusClass: 'status-pending', desc: 'Table 04 - $82.50', time: '14:25:44 UTC' },
    { tx: '#TX_8831', status: 'Paid', statusClass: 'status-paid', desc: 'Table 22 - $310.00', time: '14:28:12 UTC' },
    { tx: '#TX_VOID', status: 'Void', statusClass: 'status-void', desc: 'Table 01 - Refunded', time: '14:30:01 UTC' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initWebGL();
    }
  }

  private initWebGL() {
    const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    function syncSize() {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main() {
    vec2 uv = v_texCoord;
    float orangeBlob = smoothstep(0.6, 0.0, distance(uv, vec2(0.2 + 0.1 * sin(u_time * 0.4), 0.3 + 0.1 * cos(u_time * 0.5))));
    float violetBlob = smoothstep(0.7, 0.0, distance(uv, vec2(0.8 + 0.1 * cos(u_time * 0.3), 0.7 + 0.1 * sin(u_time * 0.4))));
    float tertiaryBlob = smoothstep(0.5, 0.0, distance(uv, vec2(0.5 + 0.2 * sin(u_time * 0.2), 0.5 + 0.2 * cos(u_time * 0.3))));
    vec3 orange = vec3(0.976, 0.451, 0.086);
    vec3 violet = vec3(0.545, 0.361, 0.965);
    vec3 base = vec3(0.973, 0.980, 0.988);
    vec3 color = base;
    color = mix(color, orange, orangeBlob * 0.3);
    color = mix(color, violet, violetBlob * 0.3);
    color = mix(color, orange, tertiaryBlob * 0.1);
    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
        mouse.y = (1.0 - (event.clientY - rect.top) / rect.height) * canvas.height;
      }
    });
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    function render(t: number) {
      syncSize();
      gl!.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }
    render(0);
  }
}
