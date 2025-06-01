// 自動產生 2 分鐘的鼓點（每拍 0.34 秒，交錯 fist/palm）
const beatTimes = [];
const beatTypes = [];
const totalDuration = 120; // 秒
const beatInterval = 0.34; // 每拍秒數

for (let t = 0, i = 0; t < totalDuration; t += beatInterval, i++) {
  beatTimes.push(Number(t.toFixed(2)));
  beatTypes.push(i % 2 === 0 ? 'fist' : 'palm');
}