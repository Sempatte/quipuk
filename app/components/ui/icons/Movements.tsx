// HomeIcon.tsx
import React from "react";
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, G, Path } from "react-native-svg";
import { SvgProps } from "react-native-svg";

interface SvgProps_ extends SvgProps {
  backgroundcolor: string
 }

const MovementsIcon: React.FC<SvgProps_> = ({
  color = "#FFFFFF",
  width = 24,
  height = 24,
  backgroundcolor = "#000",
  ...props
}) => (
  <Svg width="38" height="40" viewBox="0 0 38 40" fill="#FFFFFF" style={{ backgroundColor: "#000" }} >
    <G filter="url(#filter0_d_820_4461)">
      <Path d="M5 9H30.2M24.6 2L31.6 9L24.6 16M33 23H7.8M13.4 16L6.4 23L13.4 30" stroke="#FFFFFF" stroke-width="3" shape-rendering="crispEdges" />
    </G>
    <Defs>
      <Filter id="filter0_d_820_4461" x="0.278809" y="0.939453" width="37.4424" height="38.1211" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <FeFlood flood-opacity="0" result="BackgroundImageFix" />
        <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <FeOffset dy="4" />
        <FeGaussianBlur stdDeviation="2" />
        <FeComposite in2="hardAlpha" operator="out" />
        <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_820_4461" />
        <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_820_4461" result="shape" />
      </Filter>
    </Defs>
  </Svg>

);

export default MovementsIcon;
