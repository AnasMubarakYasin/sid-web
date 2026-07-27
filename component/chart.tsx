// import * as React from "react";
// import { ChartsDataProvider } from "@mui/x-charts/ChartsDataProvider";
// import { ChartsSurface } from "@mui/x-charts/ChartsSurface";
// import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
// import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
// import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
// import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
// import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
// import { ChartsWrapper } from "@mui/x-charts/ChartsWrapper";
// import { ChartsLayerContainer } from "@mui/x-charts/ChartsLayerContainer";
// import { ChartsSvgLayer } from "@mui/x-charts/ChartsSvgLayer";
// import { ChartsWebGLLayer } from "@mui/x-charts/ChartsWebGLLayer";
// import { LinePlot } from "@mui/x-charts/LineChart";
// import { LineSeriesType } from "@mui/x-charts/models";

import { ChartsDataProvider } from "@mui/x-charts/ChartsDataProvider";
import { ChartsSurface } from "@mui/x-charts/ChartsSurface";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ChartsLegend } from "@mui/x-charts/ChartsLegend";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";

const ohlcData: LineSeriesType[] = [
  [100, 110, 95, 105],
  [105, 115, 100, 112],
  [112, 120, 108, 118],
  [118, 125, 115, 120],
  [120, 128, 118, 125],
  [125, 130, 120, 122],
  [122, 128, 118, 126],
  [126, 135, 124, 132],
  [132, 140, 130, 138],
  [138, 145, 135, 135],
  [135, 148, 138, 145],
  [145, 152, 142, 148],
  [148, 155, 145, 150],
  [150, 158, 148, 152],
  [152, 162, 151, 151],
  [151, 165, 151, 157],
  [157, 168, 153, 153],
  [153, 160, 151, 152],
  [152, 155, 150, 154],
  [154, 158, 153, 157],
];

const xAxisData = ohlcData.map((_, index) => `Day ${index + 1}`);

const pData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
const xLabels = [
  "Page A",
  "Page B",
  "Page C",
  "Page D",
  "Page E",
  "Page F",
  "Page G",
];

export default function Chart() {
  return (
    <ChartsDataProvider
      series={[{ type: "line", data: pData, showMark: true }]}
      xAxis={[{ scaleType: "point", data: xLabels, label: "Tegangan" }]}
      yAxis={[{ width: 50, label: "Arus" }]}
      margin={{ top: 30, right: 30, bottom: 20, left: 20 }}
    >
      <ChartsLegend />
      <ChartsTooltip />
      <ChartsSurface>
        <ChartsXAxis />
        <ChartsYAxis />
        <LinePlot />
        <MarkPlot />
        <ChartsAxisHighlight x="line" y="line" />
      </ChartsSurface>
    </ChartsDataProvider>
  );
}
