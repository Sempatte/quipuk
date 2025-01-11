// HomeIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";
import { SvgProps } from "react-native-svg";

const HomeIcon: React.FC<SvgProps> = ({
  color = "#222",
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg
    width="39"
    height="31"
    viewBox="0 0 39 31"
    fill="none"
  >
    <Path
      d="M16.1765 30V20.1176H22.7647V30H31V16.8235H35.9412L19.4706 2L3 16.8235H7.94118V30H16.1765Z"
      stroke="#F8F8F8"
      stroke-width="2"
    />
  </Svg>
);

export default HomeIcon;
