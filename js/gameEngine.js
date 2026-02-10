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

    // 아이템 타입 정의
    this.itemTypes = [
      { type: "apple", score: 100, speed: 150, color: "red", prob: 0.5, radius: 20 },
      { type: "grape", score: 200, speed: 200, color: "purple", prob: 0.3, radius: 20 },
      { type: "orange", score: 300, speed: 300, color: "orange", prob: 0.1, radius: 15 }, // 작고 빠름
      { type: "bomb", score: 0, speed: 180, color: "black", prob: 0.1, radius: 25 }
    ];

    // 콜백 함수
    this.onScoreUpdate = null;
    this.onGameOver = null;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.lanes = {
      "Left": width * 0.2,
      "Center": width * 0.5,
      "Right": width * 0.8
    };
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.timeLeft = 60;
    this.missedFruits = 0;
    this.level = 1;
    this.items = [];
    this.isGameActive = true;
    this.spawnInterval = 1500;
    this.lastFrameTime = performance.now();

    // UI 초기화 호출
    this.updateUI();
  }

  stop() {
    this.isGameActive = false;
  }

  // 외부에서 호출: 포즈 입력 처리
  setPlayerPose(poseLabel) {
    if (["Left", "Center", "Right"].includes(poseLabel)) {
      this.playerLane = poseLabel;
    }
  }

  // 메인 게임 루프 업데이트
  update(currentTime) {
    if (!this.isGameActive) return;

    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 초 단위
    this.lastFrameTime = currentTime;

    // 1. 시간 감소
    this.timeLeft -= deltaTime;
    if (this.timeLeft <= 0) {
      this.gameOver("Time Over!");
      return;
    }

    // 2. 레벨 및 난이도 조정 (시간 경과에 따라)
    const timeElapsed = 60 - this.timeLeft;
    if (timeElapsed > 40) { // 40초~60초 (고수)
      this.spawnInterval = 600;
      this.level = 3;
    } else if (timeElapsed > 20) { // 20초~40초 (중급)
      this.spawnInterval = 1000;
      this.level = 2;
    } else {
      this.spawnInterval = 1500;
      this.level = 1;
    }

    // 3. 아이템 생성
    this.spawnTimer += deltaTime * 1000;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnItem();
      this.spawnTimer = 0;
    }

    // 4. 아이템 이동 및 충돌 체크
    this.items.forEach((item, index) => {
      item.y += item.speed * deltaTime;

      // 바닥에 닿았을 때 (놓침)
      if (item.y > this.height) {
        this.items.splice(index, 1);
        if (item.type !== "bomb") {
          this.handleMiss();
        }
      }
      // 플레이어와 충돌 체크 (간단한 거리 기반 or Y축 위치 기반)
      // 플레이어는 바닥 근처에 고정
      else if (item.y > this.height - 60 && item.y < this.height - 10) {
        if (item.lane === this.playerLane) {
          this.items.splice(index, 1);
          this.handleCollision(item);
        }
      }
    });

    this.updateUI();
  }

  spawnItem() {
    const lanes = ["Left", "Center", "Right"];
    let selectedType = this.itemTypes[0];
    let selectedLane = "Center";
    let speedMultiplier = 1 + (this.level - 1) * 0.3;
    let finalSpeed = 0;

    // Retry loop to find valid spawn (prevent impossible patterns)
    let validSpawn = false;
    let attempts = 0;

    while (!validSpawn && attempts < 5) {
      attempts++;

      // 1. Random Lane
      selectedLane = lanes[Math.floor(Math.random() * lanes.length)];

      // 2. Random Type (Corrected Logic)
      const rand = Math.random();
      let cumulativeProb = 0;
      let bombProbMod = (this.level - 1) * 0.05;

      for (let type of this.itemTypes) {
        let prob = type.prob;
        if (type.type === "bomb") prob += bombProbMod;

        cumulativeProb += prob;
        // 단순 if (rand <= cumulativeProb) 만으로는 부족할 수 있으므로, 루프 종료 조건 명확히
        if (rand <= cumulativeProb) {
          selectedType = type;
          break;
        }
      }
      // 혹시라도 루프 끝까지 선택 안되면 마지막 타입(보통 폭탄) 방지 위해 기본값(사과) 설정
      if (!selectedType) selectedType = this.itemTypes[0];


      finalSpeed = selectedType.speed * speedMultiplier;

      // 3. Validation: Check Landing Time Conflict
      const newLandingTime = this.height / finalSpeed;
      let conflict = false;

      for (let item of this.items) {
        const remainingDist = this.height - item.y;
        if (remainingDist <= 0) continue;

        const existingLandingTime = remainingDist / item.speed;
        const timeDiff = Math.abs(newLandingTime - existingLandingTime);

        if (timeDiff < 0.6) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        validSpawn = true;
      }
    }

    if (validSpawn) {
      this.items.push({
        ...selectedType,
        lane: selectedLane,
        x: this.lanes[selectedLane],
        y: -50,
        speed: finalSpeed
      });
    }
  }

  handleCollision(item) {
    if (item.type === "bomb") {
      this.lives = 0;
      this.updateUI();
      this.gameOver("Bomb Touched!");
    } else {
      this.score += item.score;
      // 효과음 재생 로직 (선택적)
    }
  }

  handleMiss() {
    this.missedFruits++;
    // 규칙: 과일 2개 놓치면 종료 (2개째에 종료)
    if (this.missedFruits >= 2) {
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

    // 2. 아이템 그리기
    this.items.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fill();

      // 텍스트 (이모지)
      ctx.font = "20px Arial";
      let icon = "";
      if (item.type === "apple") icon = "🍎";
      else if (item.type === "grape") icon = "🍇";
      else if (item.type === "orange") icon = "🍊";
      else if (item.type === "bomb") icon = "💣";

      ctx.fillText(icon, item.x, item.y + 7);
    });
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;
