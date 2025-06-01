let video;
let handpose;
let predictions = [];
let beats = [];
let beatInterval = 600; // 鼓點間隔(ms)，可依音樂調整
let assistLineY = 0;
let song;
let gameStarted = false;
let nextBeatIndex = 0; // 下一個要產生的鼓點索引

// 載入音樂
function preload() {
  song = loadSound('music.mp3'); // 請確認檔名正確
}

function setup() {
  createCanvas(800, 600);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });
}

function modelReady() {
  console.log("Handpose model loaded!");
}

function draw() {
  // 半透明灰色背景
  background(60, 60, 60, 180);

  // 花邊裝飾
  drawDecorations();

  // 鼓點輔助白線
  stroke(255, 180);
  strokeWeight(2);
  assistLineY = (millis() % beatInterval) / beatInterval * height;
  line(0, assistLineY, width, assistLineY);

  // 依據音樂進度產生鼓點
  if (gameStarted && song.isPlaying() && typeof beatTimes !== "undefined") {
    let currentTime = song.currentTime();
    while (
      nextBeatIndex < beatTimes.length &&
      beatTimes[nextBeatIndex] <= currentTime + 1 // 提前1秒產生，讓鼓點有下落時間
    ) {
      let type = beatTypes[nextBeatIndex];
      beats.push({
        y: -60, // 從畫面上方開始
        type: type,
        color: type === 'fist' ? color(0, 120, 255) : color(255, 60, 60),
        hit: false,
        leftChances: 2,
        rightChances: 2,
        time: beatTimes[nextBeatIndex]
      });
      nextBeatIndex++;
    }
  }

  // 鼓點下落與判定
  for (let i = beats.length - 1; i >= 0; i--) {
    let beat = beats[i];
    // 依據音樂進度計算鼓點位置
    if (gameStarted && song.isPlaying()) {
      let timeToHit = beat.time - song.currentTime();
      let dropDuration = 1.0;
      let targetY = height * (1 - timeToHit / dropDuration);
      beat.y = constrain(targetY, -60, height + 60);
    } else {
      beat.y += 2;
    }

    fill(beat.color);
    let x = width / 2;
    ellipse(x, beat.y, 60, 60);

    // 暫時取消手勢判定，僅顯示鼓點
    // if (
    //   !beat.hit &&
    //   abs(beat.y - assistLineY) < 30 &&
    //   gameStarted &&
    //   song.isPlaying()
    // ) {
    //   // ...手勢判定區塊...
    // }

    // 超出畫面或已擊中就移除
    if (beat.y > height + 60 /*|| (beat.hit && beat.y > height / 2)*/) {
      beats.splice(i, 1);
    }
  }

  // 畫出手部關鍵點
  drawHands();

  // 提示
  if (!gameStarted) {
    fill(255, 220);
    textSize(28);
    textAlign(CENTER, CENTER);
    text('點擊畫面開始音樂', width / 2, height / 2);
  }
}

// 花邊裝飾
function drawDecorations() {
  noFill();
  stroke(200, 200, 255, 80);
  strokeWeight(4);
  for (let i = 0; i < 10; i++) {
    ellipse(width / 2, height / 2, 700 - i * 40, 500 - i * 30);
  }
}

// 畫手部關鍵點
function drawHands() {
  for (let i = 0; i < predictions.length; i++) {
    let hand = predictions[i];
    for (let j = 0; j < hand.landmarks.length; j++) {
      let [x, y] = hand.landmarks[j];
      fill(255, 0, 0);
      noStroke();
      ellipse(x, y, 10, 10);
    }
  }
  // 新增：顯示偵測到幾隻手
  fill(255);
  textSize(16);
  text("偵測到手數：" + predictions.length, 20, 30);
}

// 偵測左/右手握拳
function detectFist(preds, handType) {
  for (let i = 0; i < preds.length; i++) {
    let hand = preds[i];
    if (hand.handInViewConfidence > 0.8) {
      let isLeft = hand.annotations.thumb[0][0] < width / 2;
      if ((handType === 'left' && isLeft) || (handType === 'right' && !isLeft)) {
        let thumb = hand.landmarks[4];
        let index = hand.landmarks[8];
        let d = dist(thumb[0], thumb[1], index[0], index[1]);
        if (d < 40) return true;
      }
    }
  }
  return false;
}

// 偵測左/右手張開
function detectPalm(preds, handType) {
  for (let i = 0; i < preds.length; i++) {
    let hand = preds[i];
    if (hand.handInViewConfidence > 0.8) {
      let isLeft = hand.annotations.thumb[0][0] < width / 2;
      if ((handType === 'left' && isLeft) || (handType === 'right' && !isLeft)) {
        let thumb = hand.landmarks[4];
        let index = hand.landmarks[8];
        let d = dist(thumb[0], thumb[1], index[0], index[1]);
        if (d > 80) return true;
      }
    }
  }
  return false;
}

// 點擊開始音樂
function mousePressed() {
  if (song && !song.isPlaying()) {
    song.setVolume(0.2); // 設定音量為 0.2
    song.play();
    gameStarted = true;
  }
}
