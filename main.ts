const sleepStartTime = '2021-04-03 15:55:00';
const wakeTime = '2021-04-03 22:55:00';
const sleepString = `421031111111111110000000000000000011111111111100000000000000000000000000000041111122222222222222222222222222111111111111111111111111114111111111111111111111111111000000011111111111111111111111111111111111111111222222222222222222222222222222222222222222222222222111111111111111111111111111111111001000000111111111111111111111111111111111111111111111111111111111111111111222222222222222222222222444444444444411111114144111111111111111111111111111111111111112222222222222222222222222222222222222222222222222222222222211111111111111111111111111111111111111144441111111122211222222224411111111111111141111`;

const data = Array.from(sleepString).map((v) => ({
  stage: Number(v) as (typeof SleepLevelEnum)[keyof typeof SleepLevelEnum]
}));

const SleepLevelEnum = {
  AWAKE: 4,
  REM: 2,
  CORE: 1,
  DEEP: 0,
  INSOMNIA: 3,
} as const

// 같은 단계끼리 묶기
const blocks: {
  start: number
  end: number
  stage: (typeof SleepLevelEnum)[keyof typeof SleepLevelEnum]
}[] = [];

let start = 0;
for (let i = 1; i <= data.length; i++) {
  if (i === data.length || data[i].stage !== data[start].stage) {
    blocks.push({
      start,
      end: i,
      stage: data[start].stage
    });
    start = i;
  }
}

const stageLabels = {
  [SleepLevelEnum.AWAKE]: 'awake',
  [SleepLevelEnum.REM]: 'REM',
  [SleepLevelEnum.CORE]: 'Core',
  [SleepLevelEnum.DEEP]: 'Deep',
  [SleepLevelEnum.INSOMNIA]: 'Insomnia'
};
const stageOrder = [4, 2, 1, 0, 3];

const baseYPos = 30
const stageY = (stage: number) => baseYPos + stageOrder.indexOf(stage) * 70;

const colorMap = {
  [SleepLevelEnum.AWAKE]: '#FF6B6B',
  [SleepLevelEnum.REM]: '#4FC3F7',
  [SleepLevelEnum.DEEP]: '#9B59B6',
  [SleepLevelEnum.CORE]: '#1565C0',
  [SleepLevelEnum.INSOMNIA]: '#666666',
};

const shadowColorMap = {
  [SleepLevelEnum.AWAKE]: '#FFDADA',
  [SleepLevelEnum.REM]: '#D3F0FD',
  [SleepLevelEnum.DEEP]: '#E6D5ED',
  [SleepLevelEnum.CORE]: '#C4D8EF',
  [SleepLevelEnum.INSOMNIA]: '#D9D9D9',
}

const width = 1060;
const height = 400;
const chartLeftMargin = 60 + 15;
const chartRightMargin = 10;
const barWidth = 4;
const gap = 0;
const radius = 4;
const chartWidth = data.length * barWidth + (data.length - 1) * gap;
const fullWidth = chartWidth + chartLeftMargin + chartRightMargin;
const xPos = (index) => chartLeftMargin + index * (barWidth + gap);
const blockWidth = (start, end) =>  (end - start) * barWidth + (end - start - 1) * gap;
const blockHeight = 40

const svg = d3.select("#sleepGraph")
  .attr("width", width)
  .attr("height", height);

const yAxis = svg.append("g").attr("class", "y-axis");
const scrollArea = svg.append("g").attr("class", "scroll-area").lower();

const zoom = d3.zoom()
  .scaleExtent([1, 1]) // 확대 금지
  .translateExtent([[0, 0], [fullWidth, height]]) // 이동 한계
  .on("zoom", (event) => {
    scrollArea.attr("transform", `translate(${event.transform.x}, 0)`);
  });

svg.call(zoom);


const defs = scrollArea.append("defs");

const gradient = defs.append("linearGradient")
  .attr("id", "gradient")
  .attr("gradientUnits", "userSpaceOnUse")
  .attr("x1", "0%")
  .attr("y1", "0%")
  .attr("x2", "0%")
  .attr("y2", height);

gradient.append("stop")
  .attr("offset", `${baseYPos / 400 * 100}%`)
  .attr("stop-color", shadowColorMap[SleepLevelEnum.AWAKE]);

const blockGap = 30;

stageOrder.forEach((stage, i) => {
  const blockStart = baseYPos + i * (blockHeight + blockGap);
  const blockEnd = blockStart + blockHeight;
  const gapStart = blockEnd;
  const gapEnd = blockEnd + blockGap;

  // 블록 색 (고정색)
  gradient.append("stop")
    .attr("offset", `${(blockStart / height) * 100}%`)
    .attr("stop-color", shadowColorMap[stage]);

  gradient.append("stop")
    .attr("offset", `${(blockEnd / height) * 100}%`)
    .attr("stop-color", shadowColorMap[stage]);

  // 연결부 (gap) 그라데이션 시작
  gradient.append("stop")
    .attr("offset", `${(gapStart / height) * 100}%`)
    .attr("stop-color", shadowColorMap[stage]);

  // 다음 스테이지 색 (연결부 그라데이션 끝)
  const nextStage = stageOrder[i + 1] ?? stage;
  gradient.append("stop")
    .attr("offset", `${(gapEnd / height) * 100}%`)
    .attr("stop-color", shadowColorMap[nextStage]);
});

// 단계 텍스트
yAxis.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", chartLeftMargin - 15)
  .attr("height", height)
  .attr("fill", "#fff")
Object.entries(stageLabels).forEach(([stage, label]) => {
  yAxis.append("text")
    .attr("x", 10)
    .attr("y", stageY(Number(stage)) + 26)
    .attr("fill", "#aaa")
    .attr("font-size", "13px")
    .text(label);
});

// 1. 매인 블록
scrollArea.selectAll("rect.stage")
  .data(blocks)
  .enter()
  .append("rect")
  .attr("class", "stage")
  .attr("x", d => xPos(d.start))
  .attr("y", d => stageY(d.stage))
  .attr("width", d => blockWidth(d.start, d.end))
  .attr("height", blockHeight)
  .attr("fill", d => colorMap[d.stage])
  .attr("rx", radius)
  .attr("ry", radius)

// 2. 쉐도우
const shadowGap = 2
const shadowRadius = shadowGap * 2
scrollArea.selectAll("rect.shadow")
  .data(blocks)
  .enter()
  .append("rect")
  .attr("class", "shadow")
  .attr("x", d => xPos(d.start) - shadowGap)
  .attr("y", d => stageY(d.stage) - shadowGap)
  .attr("width", d => blockWidth(d.start, d.end) + shadowGap * 2)
  .attr("height", blockHeight + shadowGap * 2)
  .attr("rx", shadowRadius)
  .attr("ry", shadowRadius)
  .attr("fill", `url(#gradient)`)
  .lower();

// 3. 부드러운 연결부 (path)
for (let i = blocks.length - 2; i >= 0; i--) {
  const curr = blocks[i];
  const next = blocks[i + 1];

  const r = shadowGap;
  const x1 = xPos(curr.end);
  const x2 = xPos(next.start);
  const y1 = stageY(curr.stage);
  const y2 = stageY(next.stage);
  const h = blockHeight;

  const isDown = y2 > y1;
  const isRight = curr.start > next.start;
  const isCurrWidthShort = blockWidth(curr.start, curr.end) / 2 + r < shadowRadius
  const isNextWidthShort = blockWidth(next.start, next.end) / 2 + r < shadowRadius

  const path = d3.path();

  if (isDown) {
    path.moveTo(x1 - r, y1 + h - r);
    path.lineTo(x1 - r, y1 + h + r);
    path.lineTo(x1 - r - shadowRadius, y1 + h + r);
    path.arc(   x1 - r - shadowRadius, y1 + h + r + shadowRadius, shadowRadius, -(Math.PI / 2), 0, false);
    path.lineTo(x1 - r, y2 + r);
    path.lineTo(x2 + r, y2 + r);
    path.lineTo(x2 + r, y2 - r);
    path.lineTo(x2 + r + shadowRadius, y2 - r);
    path.arc(x2 + r + shadowRadius, y2 - r - shadowRadius, shadowRadius, Math.PI / 2, Math.PI, false);
    path.lineTo(x2 + r, y1 + h - r);
    path.lineTo(x1 - r, y1 + h - r);
    path.closePath();
  } else {
    path.moveTo(x1 - r, y1 + r);
    path.lineTo(x1 - r, y1 + r - shadowRadius);
    path.lineTo(x1 - r - shadowRadius, y1 + r - shadowRadius);
    path.arc(x1 - r - shadowRadius, y1 - r - shadowRadius, shadowRadius, (Math.PI / 2), 0, true);
    path.lineTo(x1 - r, y2 + h - r);
    path.lineTo(x2 + r, y2 + h - r);
    path.lineTo(x2 + r, y2 + h - r + shadowRadius);
    path.lineTo(x2 + r + shadowRadius, y2 + h - r + shadowRadius);
    path.arc(x2 + r + shadowRadius, y2 + h - r + shadowRadius + shadowRadius, shadowRadius, -(Math.PI / 2), Math.PI, true);
    path.lineTo(x2 + r, y1 + r);
    path.lineTo(x1 - r, y1 + r);
    path.closePath();
  }

  const pathEl = scrollArea.append("path")
    .attr("d", path.toString())
    .attr("fill", `url(#gradient)`)
    .lower();

  if (isCurrWidthShort || isNextWidthShort) {
    const clipId = `clip-${i}`;

    const clipX = xPos(isRight ? curr.start : curr.end) - r - (isCurrWidthShort ? 0 : shadowRadius)
    const clipWidth = (isCurrWidthShort ? 0 : shadowRadius) + r * 2 + (isNextWidthShort ? 0 : shadowRadius)
    const clipY1 = isDown ? y1 : y2
    const clipY2 = isDown ? y2 : y1

    defs.append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("id", clipId)
      .attr("x", clipX)
      .attr("y", Math.min(clipY1 + h - r, clipY2 + r))
      .attr("width", clipWidth)
      .attr("height", Math.abs((clipY2 + r) - (clipY1 + h - r)))

    pathEl.attr("clip-path", `url(#${clipId})`)
  }
}

// === 4. 시간 축 ===
const sleepStart = new Date(sleepStartTime);
const wake = new Date(wakeTime);

// 수면 문자열은 1분 단위이므로, 총 수면 시간은 문자열 길이로 계산
const totalMinutes = data.length;
const timePerBar = 1; // 1분 단위

const tickInterval = 120; // 2시간 마다
const tickY = height - 20;

for (let minutesOffset = 0; minutesOffset <= totalMinutes; minutesOffset += tickInterval) {
  const tickTime = new Date(sleepStart.getTime() + minutesOffset * 60000);
  const h = tickTime.getHours().toString().padStart(2, '0');
  const m = tickTime.getMinutes().toString().padStart(2, '0');
  const timeLabel = `${h}:${m}`;

  const i = minutesOffset; // i번째 바에 해당
  const x = xPos(i) - gap / 2;

  const timeText = scrollArea.append("text")
    .attr("y", tickY)
    .attr("fill", "#888")
    .attr("font-size", "11px")
    .attr("text-anchor", "start")
    .text(timeLabel);

  const textWidth = timeText.node().getBBox().width;
  timeText.attr("x", x - textWidth / 2);

  scrollArea.append("line")
    .attr("x1", x)
    .attr("x2", x)
    .attr("y1", baseYPos)
    .attr("y2", tickY - 10)
    .attr("stroke", "#888")
    .attr("stroke-dasharray", "2,2")
    .attr("stroke-width", 0.5);
}