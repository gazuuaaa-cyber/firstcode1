/**
 * gameEngine.js
 * "Catch the Sky Fruits" 게임 로직 구현
 */

class GameEngine {
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.timeLeft = 60;
    this.missedFruits = 0;
    this.level = 1;

    this.items = []; // 떨어지는 아이템 배열
    this.playerLane = "Center"; // 현재 플레이어 위치 (Left, Center, Right)

    this.isGameActive = false;
    this.lastFrameTime = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1500; // 초기 아이템 생성 간격 (ms)

    // 캔버스 크기 (main.js에서 설정됨)
    this.width = 400;
    this.height = 400;

    // 레인 좌표 (X축)
    this.lanes = {
      "Left": 70,
      "Center": 200,
      "Right": 330
    };

    // 아이템 타입 정의 (속도 사용자 지정: 사과(250) < 폭탄(270) < 포도(300) < 오렌지(350))
    this.itemTypes = [
      { type: "apple", score: 100, speed: 250, color: "red", prob: 0.28, radius: 20 },
      { type: "grape", score: 200, speed: 300, color: "purple", prob: 0.28, radius: 20 },
      { type: "orange", score: 300, speed: 350, color: "orange", prob: 0.27, radius: 15 },
      { type: "bomb", score: 0, speed: 270, color: "black", prob: 0.17, radius: 25 }
    ];

    // 콜백 함수
    this.onScoreUpdate = null;
    this.onGameOver = null;
  }

  init(width, height, soundManager) {
    this.width = width;
    this.height = height;
    this.soundManager = soundManager; // SoundManager 저장
    this.lanes = {
      "Left": width * 0.2,
      "Center": width * 0.5,
      "Right": width * 0.8
    };
  }
  // ... (skip unchanged code) ...
  handleCollision(item) {
    if (item.type === "bomb") {
      this.lives = 0;
      this.updateUI();
      if (this.soundManager) this.soundManager.play('bomb'); // 폭탄 소리
      this.gameOver("Bomb Touched!");
    } else {
      this.score += item.score;
      if (this.soundManager) this.soundManager.play('catch'); // 획득 소리
    }
  }

  handleMiss() {
    this.missedFruits++;
    if (this.soundManager) this.soundManager.play('miss'); // 놓침 소리

    // 규칙: 과일 2개 놓치면 종료 (2개째에 종료)
    if (this.missedFruits >= 2) {
      if (this.soundManager) this.soundManager.play('gameover'); // 게임오버 소리
      this.gameOver("Missed 2 Fruits!");
    }
  }

  gameOver(reason) {
    this.isGameActive = false;
    if (this.onGameOver) {
      this.onGameOver(this.score, reason);
    }
  }

  updateUI() {
    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        score: this.score,
        time: Math.ceil(this.timeLeft),
        missed: this.missedFruits,
        maxMisses: 2 // 최대 허용 개수
      });
    }
  }

  // 캔버스에 그리기
  draw(ctx) {
    // 1. 플레이어(바구니) 그리기
    const playerX = this.lanes[this.playerLane];
    const playerY = this.height - 40;

    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    // 바구니 모양 (반원)
    ctx.arc(playerX, playerY, 30, 0, Math.PI, false);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Bowl", playerX, playerY - 5);

    // 2. 아이템 그리기 (원 대신 큰 이모지만 그림)
    this.items.forEach(item => {
      // 텍스트 (이모지)
      ctx.font = "40px Arial"; // 크기 키움
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let icon = "";
      if (item.type === "apple") icon = "🍎";
      else if (item.type === "grape") icon = "🍇";
      else if (item.type === "orange") icon = "🍊";
      else if (item.type === "bomb") icon = "💣";

      ctx.fillText(icon, item.x, item.y);

      // 디버깅용 충돌 박스 (필요시 주석 해제)
      // ctx.strokeStyle = "red";
      // ctx.beginPath();
      // ctx.arc(item.x, item.y, item.radius, 0, Math.PI*2);
      // ctx.stroke();
    });
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;
