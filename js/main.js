/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;
let animationFrameId;

/**
 * 애플리케이션 초기화
 */
async function init() {
  const startBtn = document.getElementById("startBtn");

  // UI 초기화
  document.getElementById("start-overlay").classList.add("hidden");
  document.getElementById("game-overlay").classList.add("hidden");

  try {
    // 1. 캔버스 설정
    const canvas = document.getElementById("canvas");
    canvas.width = 400; // 게임 화면 크기에 맞춤
    canvas.height = 400;
    ctx = canvas.getContext("2d");

    // 2. GameEngine 초기화
    if (!gameEngine) {
      gameEngine = new GameEngine();
      gameEngine.init(canvas.width, canvas.height);

      // 콜백 연결
      gameEngine.onScoreUpdate = updateScoreBoard;
      gameEngine.onGameOver = showGameOver;
    }

    // 3. PoseEngine 초기화 (최초 1회만)
    if (!poseEngine) {
      poseEngine = new PoseEngine("./my_model/");
      const { maxPredictions, webcam } = await poseEngine.init({
        size: 400, // 캔버스 크기와 일치시킴
        flip: true
      });

      // Label Container 설정
      labelContainer = document.getElementById("label-container");
      labelContainer.innerHTML = "";
      for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
      }

      poseEngine.setPredictionCallback(handlePrediction);
      poseEngine.start();
    }

    // 4. Stabilizer 초기화
    if (!stabilizer) {
      stabilizer = new PredictionStabilizer({
        threshold: 0.85, // 문턱값 높임
        smoothingFrames: 5 // 부드러운 움직임
      });
    }

    // 5. 게임 시작
    gameEngine.start();

    // 6. 애니메이션 루프 시작
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    loop();

  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. (모델 로딩 실패 등)");
    document.getElementById("start-overlay").classList.remove("hidden");
  }
}

/**
 * 게임 재시작
 */
function restartGame() {
  init();
}

/**
 * 애니메이션 루프 (매 프레임 호출)
 */
function loop() {
  // 1. PoseEngine 웹캠 그리기
  if (poseEngine && poseEngine.webcam && poseEngine.webcam.canvas) {
    // 웹캠 배경을 흐릿하게 그리거나 그냥 그리기
    ctx.globalAlpha = 0.5; // 반투명
    ctx.drawImage(poseEngine.webcam.canvas, 0, 0, 400, 400);
    ctx.globalAlpha = 1.0;
  } else {
    ctx.clearRect(0, 0, 400, 400);
  }

  // 2. 게임 업데이트 및 그리기
  if (gameEngine && gameEngine.isGameActive) {
    gameEngine.update(performance.now());
    gameEngine.draw(ctx);
  }

  animationFrameId = requestAnimationFrame(loop);
}

/**
 * 예측 결과 처리 콜백
 */
function handlePrediction(predictions, pose) {
  // 1. Stabilizer로 예측 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 2. Label Container 업데이트 (디버깅용)
  if (labelContainer) {
    for (let i = 0; i < predictions.length; i++) {
      const classPrediction =
        predictions[i].className + ": " + predictions[i].probability.toFixed(2);
      if (labelContainer.childNodes[i]) {
        labelContainer.childNodes[i].innerHTML = classPrediction;
      }
    }
  }

  // 3. GameEngine에 포즈 전달
  if (gameEngine && gameEngine.isGameActive && stabilized.className) {
    gameEngine.setPlayerPose(stabilized.className);
  }
}

// UI 업데이트 함수들
function updateScoreBoard(data) {
  document.getElementById("score").innerText = data.score;
  document.getElementById("time").innerText = data.time;

  // 놓친 개수 / 허용 개수 표시 (예: 0 / 2)
  const missedElem = document.getElementById("missed");
  missedElem.innerText = `${data.missed} / ${data.maxMisses}`;

  if (data.missed >= 1) {
    missedElem.style.color = "red";
  } else {
    missedElem.style.color = "#2c3e50";
  }
}

function showGameOver(finalScore, reason) {
  document.getElementById("overlay-title").innerText = reason || "Game Over";
  document.getElementById("overlay-message").innerText = `Final Score: ${finalScore}`;
  document.getElementById("game-overlay").classList.remove("hidden");
}

// 전역 함수 노출 (HTML onclick용)
window.init = init;
window.restartGame = restartGame;
window.handlePrediction = handlePrediction; // 필요 시
