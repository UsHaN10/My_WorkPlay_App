import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Match dev server

const PONG_HTML = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PvP Pong — Local Multiplayer</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <style>
    :root {
      --bg: #0b1220;
      --fg: #e6f0ff;
      --accent: #4fd1c5;
      --muted: #8b98a8;
    }
    html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial}
    body{display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#07111a 0%, var(--bg) 60%);color:var(--fg)}
    .container{width:920px;max-width:96vw;padding:18px;text-align:center}
    canvas{background:rgba(255,255,255,0.03);display:block;margin:12px auto;border-radius:8px;box-shadow:0 6px 30px rgba(2,6,23,0.6); max-width: 100%; touch-action: none;}
    h1{margin:0;font-size:20px}
    .info{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px}
    .controls{font-size:13px;color:var(--muted)}
    .buttons{display:flex;gap:8px}
    button{background:var(--accent);border:none;color:#022;padding:8px 12px;border-radius:6px;cursor:pointer;font-weight:600}
    button.secondary{background:transparent;border:1px solid rgba(255,255,255,0.06);color:var(--fg)}
    .footer{margin-top:10px;color:var(--muted);font-size:13px}
    .scoreboard{font-size:18px;font-weight:700;letter-spacing:1px}
  </style>
</head>
<body>
  <div class="container">
    <h1 id="title">PvP Pong — Local Multiplayer</h1>
    <div class="info">
      <div class="controls" id="mode-desc">
        Touch Controls Available: Tap left/right side
      </div>
      <div class="scoreboard" id="score">0 : 0</div>
      <div class="buttons">
        <button id="restart">Restart</button>
        <button id="toggle-sound" class="secondary">Sound: On</button>
      </div>
    </div>

    <canvas id="game" width="860" height="480" aria-label="Pong game canvas"></canvas>

    <div class="footer">
      First to 7 wins. Miss the ball to give your opponent a point.
    </div>
  </div>

<script>
(() => {
  // Config
  const WIN_SCORE = 7;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById('score');
  const restartBtn = document.getElementById('restart');
  const soundToggleBtn = document.getElementById('toggle-sound');
  const titleEl = document.getElementById('title');
  const descEl = document.getElementById('mode-desc');

  // Network Multiplier Config (Injected later)
  window.NETWORK_MODE = false;
  window.NETWORK_ROLE = null; 

  // Network Sync Methods (Called externally via evaluateJavaScript)
  window.receiveNetworkConfig = (mode, role) => {
      window.NETWORK_MODE = mode;
      window.NETWORK_ROLE = role;
      if (mode) {
           titleEl.textContent = "ONLINE MULTIPLAYER: " + (role === "p1" ? "PLAYER 1" : "PLAYER 2");
           descEl.textContent = "Drag your side of the screen to move.";
      }
  };

  window.receiveNetworkTouch = (y) => {
      if (window.NETWORK_ROLE === 'p1') {
          paddle.rightY = y; // Opponent is P2
      } else {
          paddle.leftY = y; // Opponent is P1
      }
  };

  // Ball Sync for Online Play
  window.receiveNetworkBallSync = (bx, by, bvx, bvy, sL, sR) => {
      if (window.NETWORK_ROLE === 'p2') { 
         // P1 controls ball authority securely online to prevent weird divergence
         ball.x = bx; ball.y = by; ball.vx = bvx; ball.vy = bvy;
         leftScore = sL; rightScore = sR;
         updateScoreDisplay();
      }
  }

  // Sound
  let soundOn = true;
  let audioCtx = null;
  function beep(freq=440, time=0.05, type='sine', gain=0.1){
    if(!soundOn) return;
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + time);
  }

  // Game state
  let leftScore = 0, rightScore = 0;
  let running = false, paused = false, gameOver = false;

  const paddle = {
    w: 14,
    h: 96,
    speed: 6,
    leftY: null,
    rightY: null,
  };

  const MathPI = Math.PI;
  const ball = {
    r: 8,
    x: W/2, y: H/2,
    vx: 0, vy: 0,
    speed: 5,
    maxBounceAngle: MathPI/3
  };

  function resetPositions(){
    paddle.leftY = (H - paddle.h) / 2;
    paddle.rightY = (H - paddle.h) / 2;
    ball.x = W/2;
    ball.y = H/2;
    const angle = (Math.random() * MathPI/4) - MathPI/8;
    const dir = Math.random() < 0.5 ? -1 : 1;
    
    // In online mode, P1 generates ball velocity, P2 waits for sync
    if (window.NETWORK_MODE && window.NETWORK_ROLE === 'p2') {
        ball.vx = 0; ball.vy = 0;
    } else {
        ball.vx = dir * ball.speed * Math.cos(angle);
        ball.vy = ball.speed * Math.sin(angle);
    }
  }

  function startGame(){
    leftScore = 0; rightScore = 0; gameOver = false;
    resetPositions();
    updateScoreDisplay();
    running = true;
    paused = false;
    loop();
  }

  function restart(){
    startGame();
    beep(880,0.05, 'square', 0.08);
  }

  restartBtn.addEventListener('click', () => restart());
  soundToggleBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundToggleBtn.textContent = 'Sound: ' + (soundOn ? 'On' : 'Off');
  });

  function updateScoreDisplay(){
    scoreEl.textContent = leftScore + ' : ' + rightScore;
  }

  function togglePause(){
    if(!running || window.NETWORK_MODE) return; // Prevent pause in online mode
    paused = !paused;
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function rectsIntersect(rx, ry, rw, rh, bx, by, br){
    const closestX = clamp(bx, rx, rx + rw);
    const closestY = clamp(by, ry, ry + rh);
    const dx = bx - closestX;
    const dy = by - closestY;
    return (dx*dx + dy*dy) <= (br*br);
  }

  function update(dt){
    if(!running || paused || gameOver) return;

    // move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // If I am P1 in network mode, emit ball pos occasionally? Yes, or maybe just evaluate physics!
    if (window.NETWORK_MODE && window.NETWORK_ROLE === 'p1') {
       if(Math.random() < 0.03) { // 3% chance every frame to sync perfectly
           if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ballSync', bx: ball.x, by: ball.y, bvx: ball.vx, bvy: ball.vy, sL: leftScore, sR: rightScore }));
       }
    }

    // top/bottom bounce
    if(ball.y - ball.r <= 0){ ball.y = ball.r; ball.vy = -ball.vy; beep(1200,0.02,'sine',0.04); }
    if(ball.y + ball.r >= H){ ball.y = H - ball.r; ball.vy = -ball.vy; beep(1200,0.02,'sine',0.04); }

    const leftX = 12;
    if(ball.vx < 0 && rectsIntersect(leftX, paddle.leftY, paddle.w, paddle.h, ball.x, ball.y, ball.r)){
      const relativeIntersectY = (paddle.leftY + paddle.h/2) - ball.y;
      const normalized = relativeIntersectY / (paddle.h/2);
      const bounceAngle = normalized * ball.maxBounceAngle;
      const speed = Math.min(12, Math.hypot(ball.vx, ball.vy) * 1.05);
      ball.vx = speed * Math.cos(bounceAngle);
      ball.vy = -speed * Math.sin(bounceAngle);
      ball.x = leftX + paddle.w + ball.r + 0.1;
      beep(900 + Math.random()*200, 0.02, 'square', 0.06);
    }

    const rightX = W - 12 - paddle.w;
    if(ball.vx > 0 && rectsIntersect(rightX, paddle.rightY, paddle.w, paddle.h, ball.x, ball.y, ball.r)){
      const relativeIntersectY = (paddle.rightY + paddle.h/2) - ball.y;
      const normalized = relativeIntersectY / (paddle.h/2);
      const bounceAngle = normalized * ball.maxBounceAngle;
      const speed = Math.min(12, Math.hypot(ball.vx, ball.vy) * 1.05);
      ball.vx = -speed * Math.cos(bounceAngle);
      ball.vy = -speed * Math.sin(bounceAngle);
      ball.x = rightX - ball.r - 0.1;
      beep(700 + Math.random()*200, 0.02, 'square', 0.06);
    }

    // scoring
    if(ball.x + ball.r < 0){
      rightScore++;
      updateScoreDisplay();
      if(rightScore >= WIN_SCORE) finishGame('Right Player Wins!');
      else resetPositions();
    } else if(ball.x - ball.r > W){
      leftScore++;
      updateScoreDisplay();
      if(leftScore >= WIN_SCORE) finishGame('Left Player Wins!');
      else resetPositions();
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(W/2, 0);
    ctx.lineTo(W/2, H);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, 12, paddle.leftY, paddle.w, paddle.h, 6, true, false);
    roundRect(ctx, W - 12 - paddle.w, paddle.rightY, paddle.w, paddle.h, 6, true, false);

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, MathPI*2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '72px system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(leftScore, W*0.25, 18);
    ctx.fillText(rightScore, W*0.75, 18);

    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(50, H/2 - 68, W-100, 136);
      ctx.fillStyle = 'white';
      ctx.font = '28px system-ui, -apple-system, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText(gameOver, W/2, H/2 - 6);
      ctx.font = '16px system-ui, -apple-system, "Segoe UI", Roboto';
      ctx.fillText('Tap Restart to play again', W/2, H/2 + 34);
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'undefined') r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function finishGame(text){
    gameOver = text;
    running = false;
    paused = false;
    beep(220, 0.3, 'sine', 0.12);
  }

  let lastTime = performance.now();
  function loop(now){
    if(!running || paused || gameOver){
      draw();
      return;
    }
    const dt = (now - lastTime) / (1000 / 60);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { W = canvas.width = 860; H = canvas.height = 480; });

  resetPositions();
  updateScoreDisplay();
  draw();

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    for(const t of e.changedTouches) handleTouchMove(t);
  }, {passive:false});
  
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for(const t of e.changedTouches) handleTouchMove(t);
  }, {passive:false});

  function handleTouchMove(t){
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const y = (t.clientY - rect.top) * scaleY;
    const finalY = clamp(y - paddle.h/2, 0, H - paddle.h);
    const x = t.clientX - rect.left;
    
    if (window.NETWORK_MODE) {
       // Online multiplayer
       if (window.NETWORK_ROLE === 'p1') paddle.leftY = finalY;
       if (window.NETWORK_ROLE === 'p2') paddle.rightY = finalY;
       
       if (window.ReactNativeWebView) {
           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'paddle', y: finalY }));
       }
    } else {
       // Local multiplayer
       if(x < rect.width / 2){
         paddle.leftY = finalY;
       } else {
         paddle.rightY = finalY;
       }
    }
  }
})();
</script>
</body>
</html>
`;

export default function PongScreen() {
  const router = useRouter();
  const { matchId, role } = useLocalSearchParams();
  const webviewRef = useRef<WebView>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (matchId && role) {
      // Establish socket for this room
      socketRef.current = io(SOCKET_URL);

      // On connect, emit fake join since room is made, or server logic doesn't require rejoin for relayed messages
      // Works as long as backend handles generic game_event and joins the socket back into the matchId
      socketRef.current.on('connect', () => {
        socketRef.current.emit('rejoin_match', { matchId });
      });

      socketRef.current.on('game_event', (data: any) => {
        if (data.type === 'paddle' && data.role !== role) {
          webviewRef.current?.injectJavaScript(`window.receiveNetworkTouch(${data.y}); true;`);
        } else if (data.type === 'ballSync' && role === 'p2') {
          // P2 relies on P1 for ball position
          webviewRef.current?.injectJavaScript(`window.receiveNetworkBallSync(${data.bx}, ${data.by}, ${data.bvx}, ${data.bvy}, ${data.sL}, ${data.sR}); true;`);
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [matchId, role]);

  const handleMessage = (event: any) => {
    if (!matchId) return; // Ignore if local

    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (socketRef.current) {
        socketRef.current.emit('game_event', { matchId, role, ...data });
      }
    } catch (e) { }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <X size={28} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>{matchId ? 'ONLINE PVP PONG' : 'CO-OP PONG'}</Text>
      </View>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: PONG_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMessage}
        injectedJavaScript={matchId ? `window.receiveNetworkConfig(true, '${role}'); true;` : `window.receiveNetworkConfig(false, null); true;`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#0b1220', zIndex: 10 },
  closeBtn: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginLeft: 20, letterSpacing: 2 },
  webview: { flex: 1, backgroundColor: '#0b1220' }
});
