<template>
  <div
    class="pet-container"
    :class="{ 'pet-sleeping': isSleeping }"
    title="点击不同部位互动哦~ 🦉"
  >
    <Transition name="bubble">
      <div v-if="bubbleText" class="pet-bubble">{{ bubbleText }}</div>
    </Transition>

    <svg class="pet-svg" viewBox="0 0 120 145" xmlns="http://www.w3.org/2000/svg">
      <!-- ====== 脚 ====== -->
      <g class="pet-foot" @click="handleClick('foot', $event)">
        <ellipse cx="44" cy="132" rx="11" ry="6" fill="#e8b860" />
        <ellipse cx="44" cy="130" rx="9" ry="4.5" fill="#f0d080" />
        <circle cx="39" cy="132" r="2" fill="#d4a040" />
        <circle cx="44" cy="132" r="2" fill="#d4a040" />
        <circle cx="49" cy="132" r="2" fill="#d4a040" />

        <ellipse cx="76" cy="132" rx="11" ry="6" fill="#e8b860" />
        <ellipse cx="76" cy="130" rx="9" ry="4.5" fill="#f0d080" />
        <circle cx="71" cy="132" r="2" fill="#d4a040" />
        <circle cx="76" cy="132" r="2" fill="#d4a040" />
        <circle cx="81" cy="132" r="2" fill="#d4a040" />
      </g>

      <!-- ====== 身体 ====== -->
      <g class="pet-body" @click="handleClick('body', $event)">
        <ellipse cx="60" cy="100" rx="34" ry="33" fill="#c8913c" />
        <!-- 肚皮花纹 -->
        <ellipse cx="60" cy="104" rx="22" ry="20" fill="#f0d080" />
        <ellipse cx="60" cy="104" rx="16" ry="14" fill="#f8e8b8" />
        <!-- 肚皮斑点 -->
        <circle cx="52" cy="98" r="2.5" fill="#e8c860" opacity="0.5" />
        <circle cx="66" cy="108" r="2" fill="#e8c860" opacity="0.5" />
        <circle cx="58" cy="112" r="1.8" fill="#e8c860" opacity="0.5" />
      </g>

      <!-- ====== 左翅膀 ====== -->
      <g class="pet-wing pet-wing-left" @click="handleClick('wing', $event)">
        <ellipse cx="23" cy="88" rx="16" ry="25" fill="#b07828" transform="rotate(-12 23 88)" />
        <!-- 翅膀纹理 -->
        <path d="M18 75 Q26 85 24 98" fill="none" stroke="#c8913c" stroke-width="2" stroke-linecap="round" />
        <path d="M14 82 Q22 90 20 102" fill="none" stroke="#c8913c" stroke-width="1.5" stroke-linecap="round" />
      </g>

      <!-- ====== 右翅膀 ====== -->
      <g class="pet-wing pet-wing-right" @click="handleClick('wing', $event)">
        <ellipse cx="97" cy="88" rx="16" ry="25" fill="#b07828" transform="rotate(12 97 88)" />
        <path d="M102 75 Q94 85 96 98" fill="none" stroke="#c8913c" stroke-width="2" stroke-linecap="round" />
        <path d="M106 82 Q98 90 100 102" fill="none" stroke="#c8913c" stroke-width="1.5" stroke-linecap="round" />
      </g>

      <!-- ====== 头部 ====== -->
      <g class="pet-head" @click="handleClick('head', $event)">
        <!-- 头主体 -->
        <ellipse cx="60" cy="60" rx="35" ry="32" fill="#c8913c" />

        <!-- 耳簇（左） -->
        <g class="pet-ear pet-ear-left" @click.stop="handleClick('ear', $event)">
          <ellipse cx="28" cy="34" rx="10" ry="14" fill="#b07828" transform="rotate(-20 28 34)" />
          <ellipse cx="28" cy="34" rx="7" ry="10" fill="#d4a050" transform="rotate(-20 28 34)" />
        </g>

        <!-- 耳簇（右） -->
        <g class="pet-ear pet-ear-right" @click.stop="handleClick('ear', $event)">
          <ellipse cx="92" cy="34" rx="10" ry="14" fill="#b07828" transform="rotate(20 92 34)" />
          <ellipse cx="92" cy="34" rx="7" ry="10" fill="#d4a050" transform="rotate(20 92 34)" />
        </g>

        <!-- 面部浅色区域（心形感觉） -->
        <ellipse cx="60" cy="66" rx="28" ry="22" fill="#f0d080" />
        <ellipse cx="60" cy="64" rx="24" ry="18" fill="#f8e8b8" />

        <!-- 眼周深色环 -->
        <ellipse cx="47" cy="56" rx="13" ry="13.5" fill="#f0d080" />
        <ellipse cx="73" cy="56" rx="13" ry="13.5" fill="#f0d080" />

        <!-- 左眼 -->
        <g class="pet-eye" @click.stop="handleClick('eye', $event)">
          <ellipse cx="47" cy="56" rx="11" ry="12" fill="white" />
          <ellipse cx="47" cy="57" rx="6.5" ry="7.5" fill="#f8a020" />
          <ellipse cx="46.5" cy="57.5" rx="4" ry="5" fill="#1a1a1e" />
          <ellipse cx="45" cy="54.5" rx="2.5" ry="2.5" fill="white" />
          <ellipse cx="48.5" cy="60" rx="1.2" ry="0.8" fill="white" opacity="0.6" />
        </g>

        <!-- 右眼 -->
        <g class="pet-eye" @click.stop="handleClick('eye', $event)">
          <ellipse cx="73" cy="56" rx="11" ry="12" fill="white" />
          <ellipse cx="73" cy="57" rx="6.5" ry="7.5" fill="#f8a020" />
          <ellipse cx="73.5" cy="57.5" rx="4" ry="5" fill="#1a1a1e" />
          <ellipse cx="75" cy="54.5" rx="2.5" ry="2.5" fill="white" />
          <ellipse cx="71.5" cy="60" rx="1.2" ry="0.8" fill="white" opacity="0.6" />
        </g>

        <!-- 眉毛 -->
        <path d="M36 44 Q41 40 48 43" fill="none" stroke="#b07828" stroke-width="2.5" stroke-linecap="round" />
        <path d="M84 44 Q79 40 72 43" fill="none" stroke="#b07828" stroke-width="2.5" stroke-linecap="round" />

        <!-- 喙 -->
        <g class="pet-beak" @click.stop="handleClick('beak', $event)">
          <ellipse cx="60" cy="72" rx="6" ry="5" fill="#f0a030" />
          <ellipse cx="60" cy="73" rx="4" ry="3" fill="#e08818" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const bubbleText = ref('')
const isSleeping = ref(false)
let bubbleTimer = null
let sleepTimer = null

const messages = {
  head: ['咕咕~ 你好呀！', '今天学 SQL 了吗？🦉', '摸头摸头~', '脑袋圆滚滚~'],
  eye: ['(眨眨大眼睛)', '✨ 目光如炬！', '盯着你呢~', '👀 看得清清楚楚'],
  ear: ['(耳羽抖抖)', '听到啦听到啦~', '耳羽竖起来！', '🦻 猫头鹰听力超好'],
  beak: ['咕咕咕！', '啄啄啄~', '🦉 啾~', '嗒嗒嗒...'],
  body: ['(抖抖羽毛)', '毛茸茸的好舒服~', '摇摇晃晃~', '圆滚滚的！'],
  wing: ['(拍拍翅膀)', '呼扇呼扇~', '翅膀有点酸...', '🪶 飞翔的梦想'],
  foot: ['(小跳步)', '蹦蹦跳跳！', '爪子抓抓~', '🦶 站稳了！'],
}

function handleClick(part, event) {
  event.stopPropagation()
  const msgs = messages[part] || messages.head
  const msg = msgs[Math.floor(Math.random() * msgs.length)]
  showBubble(msg)
  resetSleepTimer()
}

function showBubble(text) {
  clearTimeout(bubbleTimer)
  bubbleText.value = text
  bubbleTimer = setTimeout(() => { bubbleText.value = '' }, 2800)
}

function resetSleepTimer() {
  isSleeping.value = false
  clearTimeout(sleepTimer)
  sleepTimer = setTimeout(() => { isSleeping.value = true }, 35000)
}

resetSleepTimer()
</script>

<style scoped>
.pet-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 999;
  cursor: pointer;
  user-select: none;
  width: clamp(90px, 6.67vw, 155px);
  transition: transform 0.3s ease;
}
.pet-container:hover { transform: scale(1.06); }
.pet-sleeping { opacity: 0.4; }

/* ====== 气泡 ====== */
.pet-bubble {
  position: absolute;
  bottom: 105%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 7px 13px;
  font-size: 0.76rem;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  color: #3d3d56;
  pointer-events: none;
}
.pet-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: white;
}
.bubble-enter-active { animation: bubbleIn 0.22s ease-out; }
.bubble-leave-active { animation: bubbleOut 0.18s ease-in; }
@keyframes bubbleIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.75); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
@keyframes bubbleOut {
  from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  to   { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.9); }
}

/* ====== SVG 投影 ====== */
.pet-svg {
  display: block;
  filter: drop-shadow(0 3px 8px rgba(0,0,0,0.1));
}

/* ====== 耳羽 — 抖动 ====== */
.pet-ear { cursor: pointer; }
.pet-ear-left  { transform-origin: 28px 40px; }
.pet-ear-right { transform-origin: 92px 40px; }
.pet-ear:active { animation: earTwitch 0.4s ease; }
@keyframes earTwitch {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-15deg); }
  50%  { transform: rotate(10deg); }
  75%  { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}

/* ====== 头部 — 歪头 ====== */
.pet-head {
  transform-origin: 60px 65px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.pet-head:active { animation: headTilt 0.55s ease; }
@keyframes headTilt {
  0%   { transform: rotate(0deg); }
  15%  { transform: rotate(-12deg); }
  35%  { transform: rotate(8deg); }
  55%  { transform: rotate(-5deg); }
  75%  { transform: rotate(2deg); }
  100% { transform: rotate(0deg); }
}

/* ====== 身体 — 摇摆 ====== */
.pet-body {
  transform-origin: 60px 105px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.pet-body:active { animation: bodySway 0.65s ease; }
@keyframes bodySway {
  0%   { transform: rotate(0deg); }
  20%  { transform: rotate(-7deg); }
  45%  { transform: rotate(5deg); }
  70%  { transform: rotate(-3deg); }
  100% { transform: rotate(0deg); }
}

/* ====== 翅膀 — 拍动 ====== */
.pet-wing { cursor: pointer; }
.pet-wing-left  { transform-origin: 30px 90px; }
.pet-wing-right { transform-origin: 90px 90px; }
.pet-wing:active { animation: wingFlap 0.45s ease; }
@keyframes wingFlap {
  0%   { transform: rotate(0deg); }
  30%  { transform: rotate(-22deg); }
  60%  { transform: rotate(12deg); }
  100% { transform: rotate(0deg); }
}

/* ====== 眼睛 — 眨眼 ====== */
.pet-eye { cursor: pointer; }
.pet-eye:active { animation: eyeBlink 0.35s ease; }
@keyframes eyeBlink {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.04); }
  100% { transform: scaleY(1); }
}

/* ====== 喙 — 开合 ====== */
.pet-beak {
  transform-origin: 60px 73px;
  cursor: pointer;
}
.pet-beak:active { animation: beakClack 0.3s ease; }
@keyframes beakClack {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.25); }
  100% { transform: scaleY(1); }
}

/* ====== 脚 — 蹦跳 ====== */
.pet-foot { cursor: pointer; }
.pet-foot:active { animation: footHop 0.35s ease; }
@keyframes footHop {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(-8px); }
  70%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}

/* ====== 待机呼吸 ====== */
@keyframes idleBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.025); }
}
.pet-container:not(:active) .pet-body {
  animation: idleBreathe 4.5s ease-in-out infinite;
}

/* ====== 睡眠 ====== */
@keyframes sleepBreathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.012); }
}
.pet-sleeping .pet-body {
  animation: sleepBreathe 7s ease-in-out infinite !important;
}
.pet-sleeping .pet-head {
  transform: rotate(4deg);
  transition: transform 1.2s ease;
}
</style>
