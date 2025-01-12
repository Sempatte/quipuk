// HomeIcon.tsx
import React from "react";
import Svg, { Path, G, Defs, Filter, FeBlend, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite } from "react-native-svg";
import { SvgProps } from "react-native-svg";

interface SvgProps_ extends SvgProps {
  backgroundcolor: string
 }

const GraphicIcon: React.FC<SvgProps_> = ({
  color = "#F8F8F8",
  width = 24,
  height = 24,
  backgroundcolor = "#000",
  ...props
}) => (
  <Svg width="37" height="38" viewBox="0 0 37 38" fill={color} style={{backgroundColor: backgroundcolor}}>
    <G filter="url(#filter0_d_781_3476)">
      <Path
        d="M9.32259 15.4904H6.58616C5.70984 15.4904 5 16.2017 5 17.0765V27.4138C5 28.2886 5.71135 29 6.58616 29H9.32411C10.2019 29 10.9118 28.2886 10.9118 27.4123V17.0765C10.9114 16.6556 10.744 16.252 10.4463 15.9543C10.1487 15.6567 9.74506 15.4893 9.32411 15.4889M19.4556 1H16.7191C15.8413 1 15.1315 1.71135 15.1315 2.58768V27.4108C15.1315 28.2887 15.8428 28.9985 16.7206 28.9985H19.4556C20.3334 28.9985 21.0432 28.2871 21.0432 27.4108V2.58919C21.0432 1.71135 20.3319 1.00151 19.4541 1.00151M29.5885 8.83546H26.8506C25.9728 8.83546 25.2629 9.54681 25.2629 10.4246V27.4108C25.2629 28.2887 25.9743 28.9985 26.8506 28.9985H29.587C30.008 28.9981 30.4116 28.8307 30.7092 28.533C31.0069 28.2354 31.1743 27.8318 31.1747 27.4108V10.4231C31.1747 9.5453 30.4633 8.83546 29.5855 8.83546"
        stroke={color}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        shape-rendering="crispEdges"
      />
    </G>
    <Defs>
      <Filter
        id="filter0_d_781_3476"
        x="0"
        y="0"
        width="36.1748"
        height="38"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <FeFlood flood-opacity="0" result="BackgroundImageFix" />
        <FeColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <FeOffset dy="4" />
        <FeGaussianBlur stdDeviation="2" />
        <FeComposite in2="hardAlpha" operator="out" />
        <FeColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <FeBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_781_3476"
        />
        <FeBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_781_3476"
          result="shape"
        />
      </Filter>
    </Defs>
  </Svg>
);

export default GraphicIcon;
