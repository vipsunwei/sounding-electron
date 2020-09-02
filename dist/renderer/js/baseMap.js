var token = 'a714c85d6f6b4c1813ba1de9833bc6ce';
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmZGY4MWEzOC1kMGI0LTQ2ZGUtYTNjMC01YmVkYmM1NzY5MjciLCJpZCI6MTQ1NzEsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1NjU5MzkwOTJ9.rK1R8nOFLFW3v4DyUXUiSnUeZzD24FgyrjT_EBvaVaU';
// Cesium.Ion.defaultServer="/version.json";

var terrainProvider = new Cesium.CesiumTerrainProvider({
  url: "../terrain_tiles"
});

var viewer = new Cesium.Viewer('cesiumContainer', {
  shouldAnimate: true,
  animation: false, //是否创建动画小器件，左下角仪表
  baseLayerPicker: false, //是否显示图层选择器
  fullscreenButton: false, //是否显示全屏按钮
  geocoder: false, //是否显示geocoder小器件，右上角查询按钮
  homeButton: false, //是否显示Home按钮
  infoBox: false, //是否显示信息框
  sceneModePicker: false, //是否显示3D/2D选择器
  selectionIndicator: false, //是否显示选取指示器组件
  timeline: false, //是否显示时间轴
  navigationHelpButton: false, //是否显示右上角的帮助按钮
  // terrainProvider:terrainProvider
});

// 服务域名
var tdtUrl = 'https://t{s}.tianditu.gov.cn/';
// 服务负载子域
var subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

// 抗锯齿
if(Cesium.FeatureDetection.supportsImageRenderingPixelated()){//判断是否支持图像渲染像素化处理
  viewer.resolutionScale = window.devicePixelRatio;
}
viewer.scene.fxaa = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
// 水雾特效
viewer.scene.globe.showGroundAtmosphere = true;
// 设置最大俯仰角，[-90,0]区间内，默认为-30，单位弧度
viewer.scene.screenSpaceCameraController.constrainedPitch = Cesium.Math.toRadians(-20);
// 取消默认的双击事件
// viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

// 叠加影像服务
var imgMap = new Cesium.UrlTemplateImageryProvider({
  url: tdtUrl + 'DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' + token,
  subdomains: subdomains,
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  maximumLevel: 18
});
viewer.imageryLayers.addImageryProvider(imgMap);

// 叠加国界服务
var iboMap = new Cesium.UrlTemplateImageryProvider({
  url: tdtUrl + 'DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=' + token,
  subdomains: subdomains,
  tilingScheme: new Cesium.WebMercatorTilingScheme(),
  maximumLevel: 10
});
viewer.imageryLayers.addImageryProvider(iboMap);

// 叠加地形服务
var terrainUrls = new Array();

for (var i = 0; i < subdomains.length; i++) {
  var url = tdtUrl.replace('{s}', subdomains[i]) + 'DataServer?T=elv_c&tk=' + token;
  terrainUrls.push(url);
}

var provider = new Cesium.GeoTerrainProvider({
  urls: terrainUrls
});

//viewer.terrainProvider = terrainProvider ;//provider;

// 将三维球定位到中国
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 17850000),
  orientation: {
    heading: Cesium.Math.toRadians(348.4202942851978),
    pitch: Cesium.Math.toRadians(-89.74026687972041),
    roll: Cesium.Math.toRadians(0)
  },
  complete: function callback() {
    // 定位完成之后的回调函数
  }
});

// 叠加三维地名服务
var wtfs = new Cesium.GeoWTFS({
  viewer,
  //三维地名服务，使用wtfs服务
  subdomains: subdomains,
  metadata: {
    boundBox: {
      minX: -180,
      minY: -90,
      maxX: 180,
      maxY: 90
    },
    minLevel: 1,
    maxLevel: 20
  },
  aotuCollide: true, //是否开启避让
  collisionPadding: [5, 10, 8, 5], //开启避让时，标注碰撞增加内边距，上、右、下、左
  serverFirstStyle: true, //服务端样式优先
  labelGraphics: {
    font: "28px sans-serif",
    fontSize: 28,
    fillColor: Cesium.Color.WHITE,
    scale: 0.5,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 5,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    showBackground: false,
    backgroundColor: Cesium.Color.RED,
    backgroundPadding: new Cesium.Cartesian2(10, 10),
    horizontalOrigin: Cesium.HorizontalOrigin.MIDDLE,
    verticalOrigin: Cesium.VerticalOrigin.TOP,
    eyeOffset: Cesium.Cartesian3.ZERO,
    pixelOffset: new Cesium.Cartesian2(0, 8)
  },
  billboardGraphics: {
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.CENTER,
    eyeOffset: Cesium.Cartesian3.ZERO,
    pixelOffset: Cesium.Cartesian2.ZERO,
    alignedAxis: Cesium.Cartesian3.ZERO,
    color: Cesium.Color.WHITE,
    rotation: 0,
    scale: 1,
    width: 18,
    height: 18
  }
});

//三维地名服务，使用wtfs服务
wtfs.getTileUrl = function() {
  return tdtUrl + 'mapservice/GetTiles?lxys={z},{x},{y}&tk=' + token;
}

wtfs.getIcoUrl = function() {
  return tdtUrl + 'mapservice/GetIcon?id={id}&tk=' + token;
}

wtfs.initTDT([{
  "x": 6,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": 90,
    "minY": 0,
    "maxX": 135,
    "maxY": 45
  }
}, {
  "x": 7,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": 135,
    "minY": 0,
    "maxX": 180,
    "maxY": 45
  }
}, {
  "x": 6,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": 90,
    "minY": 45,
    "maxX": 135,
    "maxY": 90
  }
}, {
  "x": 7,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": 135,
    "minY": 45,
    "maxX": 180,
    "maxY": 90
  }
}, {
  "x": 5,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": 45,
    "minY": 0,
    "maxX": 90,
    "maxY": 45
  }
}, {
  "x": 4,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": 0,
    "minY": 0,
    "maxX": 45,
    "maxY": 45
  }
}, {
  "x": 5,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": 45,
    "minY": 45,
    "maxX": 90,
    "maxY": 90
  }
}, {
  "x": 4,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": 0,
    "minY": 45,
    "maxX": 45,
    "maxY": 90
  }
}, {
  "x": 6,
  "y": 2,
  "level": 2,
  "boundBox": {
    "minX": 90,
    "minY": -45,
    "maxX": 135,
    "maxY": 0
  }
}, {
  "x": 6,
  "y": 3,
  "level": 2,
  "boundBox": {
    "minX": 90,
    "minY": -90,
    "maxX": 135,
    "maxY": -45
  }
}, {
  "x": 7,
  "y": 2,
  "level": 2,
  "boundBox": {
    "minX": 135,
    "minY": -45,
    "maxX": 180,
    "maxY": 0
  }
}, {
  "x": 5,
  "y": 2,
  "level": 2,
  "boundBox": {
    "minX": 45,
    "minY": -45,
    "maxX": 90,
    "maxY": 0
  }
}, {
  "x": 4,
  "y": 2,
  "level": 2,
  "boundBox": {
    "minX": 0,
    "minY": -45,
    "maxX": 45,
    "maxY": 0
  }
}, {
  "x": 3,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": -45,
    "minY": 0,
    "maxX": 0,
    "maxY": 45
  }
}, {
  "x": 3,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": -45,
    "minY": 45,
    "maxX": 0,
    "maxY": 90
  }
}, {
  "x": 2,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": -90,
    "minY": 45,
    "maxX": -45,
    "maxY": 90
  }
}, {
  "x": 0,
  "y": 1,
  "level": 2,
  "boundBox": {
    "minX": -180,
    "minY": 0,
    "maxX": -135,
    "maxY": 45
  }
}, {
  "x": 1,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": -135,
    "minY": 45,
    "maxX": -90,
    "maxY": 90
  }
}, {
  "x": 0,
  "y": 0,
  "level": 2,
  "boundBox": {
    "minX": -180,
    "minY": 45,
    "maxX": -135,
    "maxY": 90
  }
}]);

viewer.cesiumWidget.creditContainer.style.display = 'none'
var camera = viewer.camera;
this.viewer.scene.globe.depthTestAgainsTerrain = true;
//设置操作习惯,更换中键和右键
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
  Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.PINCH,
  {
    eventType: Cesium.CameraEventType.LEFT_DRAG,
    modifier: Cesium.KeyboardEventModifier.CTRL
  },
  {
    eventType: Cesium.CameraEventType.RIGHT_DRAG,
    modifier: Cesium.KeyboardEventModifier.CTRL
  }
];
viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType
  .WHEEL, Cesium.CameraEventType.PINCH
];

//防止视角进入地下
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
var mousePosition, startMousePosition;
var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
handler.setInputAction(function(movement) {
  mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
  handler.setInputAction(function(movement) {
    mousePosition = movement.endPosition;
    var y = mousePosition.y - startMousePosition.y;
    if (y > 0) {
      viewer.scene.screenSpaceCameraController.enableTilt = true;
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
viewer.scene.moon.destroy();
