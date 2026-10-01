// Editorial landforms: preserve narrative relationships, not surveyed outlines.
export const outlines = {
  pine: 'M118 491C207 490 371 504 405 571S384 729 290 748S97 686 81 609S100 529 118 491Z',
  cemetery: 'M82 912C147 856 270 878 309 972S306 1262 208 1397L61 1404C34 1292 32 1073 82 912Z',
  upper: 'M530 267C692 225 1012 278 1160 437L1213 596 1061 695 766 664 600 595 506 423Z',
  ravines: 'M654 666C750 611 1060 674 1082 839S976 1038 819 1037S656 876 654 666Z',
  forest: 'M1213 654C1350 597 1538 607 1642 695S1770 827 1786 1010S1748 1362 1565 1433L1264 1412C1174 1376 1193 1321 1135 1269S1155 1097 1190 985S1191 782 1213 654Z',
  evil: 'M708 1000C782 953 904 966 964 1045S962 1236 885 1301S728 1286 701 1202S680 1072 708 1000Z',
  plain: 'M1830 586C1929 506 2151 552 2182 689L2185 1451 1830 1445Z',
  basin: 'M1100 1181C1210 1139 1383 1215 1404 1314S1351 1438 1227 1430S1083 1281 1100 1181Z',
  monsters: 'M315 967C357 936 451 955 470 1028S455 1167 403 1197S305 1170 281 1086S277 1001 315 967Z',
};

export const waterways = {
  first: 'M890 587C886 598 874 616 862 631C824 675 714 722 649 831S590 1003 615 1157C584 1187 509 1142 466 1100',
  second: 'M890 587C898 599 910 614 918 632C975 665 1115 759 1106 896S1067 1052 1100 1148S1198 1274 1210 1370',
  upper: 'M1040 169C998 226 978 285 951 347S877 424 883 483S886 546 890 587',
  hot: 'M1715 600C1693 643 1726 706 1747 775S1765 892 1768 1000S1748 1164 1735 1255',
};

// A fixed seed keeps the original decorative forest stable across renders.
function makeVegetation() {
  let seed = 67;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const trees: { x: number; y: number; size: number; dark?: boolean }[] = [];
  for (let y = 670; y < 1380; y += 55) {
    for (let x = 1200; x < 1775; x += 57) {
      const inside = (x > 1250 && y < 1350) || (x > 1210 && y > 800 && y < 1250);
      if (inside && random() > .17) trees.push({ x: x + random() * 25, y: y + random() * 21, size: 18 + random() * 9 });
    }
  }
  for (let y = 1010; y < 1260; y += 40) {
    for (let x = 718; x < 946; x += 42) {
      if (random() > .12) trees.push({ x: x + random() * 14, y: y + random() * 12, size: 21 + random() * 8, dark: true });
    }
  }
  for (let y = 530; y < 695; y += 46) {
    for (let x = 135; x < 369; x += 45) {
      if (random() > .18) trees.push({ x: x + random() * 14, y: y + random() * 14, size: 25 });
    }
  }
  const fruit = Array.from({ length: 26 }, () => ({ x: 1150 + random() * 205, y: 1205 + random() * 157, radius: 11 + random() * 6 }));
  return { trees, fruit };
}

export const vegetation = makeVegetation();
