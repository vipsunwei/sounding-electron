let clock = viewer.clock;

function ajax(options) {
  return new Promise((resolve, reject) => {
    if (!options.url) {
      console.log("请确认你的url路径");
      return;
    }
    let method = options.method || "GET";
    let isAsync = options.isAsync || true;
    let setHeader = options.setHeader || 'application/json';
    let xhr = new XMLHttpRequest();
    if (method === "GET") {
      xhr.open(method, options.url, isAsync);
      xhr.send(null);
    } else if (method === "POST") {
      xhr.open(method, options.url, isAsync);
      xhr.setRequestHeader("Content-Type", setHeader);
      xhr.send(options.data);
    }

    xhr.onreadystatechange = () => {
      if (xhr.responseText) {
        resolve(JSON.parse(xhr.responseText));
      }
    };
    xhr.onerror = err => {
      reject(err);
    };
  }).catch(e => {});
}
let station = {}
let ballNum = -1;
let changeBall = false;
let first = true;
let dataObj = {};
let startTime = new Date();
let endTime = new Date();
let endBallTime = new Date();
let speedUpIs = false;
let nowState = [-1, -1, -1];
let gloabData = [];
let ball2Time;


let stateInfo = document.querySelector('.stateInfo'),
  info = document.querySelector('.info'),
  infoState = document.querySelector('.infoState'),
  fullScreen = document.querySelector('.fullScreen'),
  seltSondeId = document.querySelector('.seltSondeId'),
  ballSondeIdBox = document.querySelector('.ballSondeId'),
  foo = document.querySelector('#foo'),
  sondeidInfo = document.querySelector('.info');

let ballFPoint, ballPPoint, ballRPoint, ball, parachute, ball2, path;
let ballPath = new Cesium.SampledPositionProperty();
let pathPosition = new Cesium.SampledPositionProperty();
let parachutePath = new Cesium.SampledPositionProperty();

// echarts
var dom = document.querySelector('#stateLine');
var myChart = echarts.init(dom);
var option = null;
var colors = ['#5793f3', '#27430A', '#FFF500', '#333'];

option = {
  color: colors,

  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    },
    formatter(params) {
      return `
						${params[0].seriesName}：${isNaN(params[0].data)?'暂无':(params[0].data).toFixed(1)} <br />
						${params[1].seriesName}：${isNaN(params[1].data)?'暂无':parseInt(params[1].data)} <br />
						${params[2].seriesName}：${isNaN(params[2].data)?'暂无':parseInt(params[2].data)} <br />
						${params[3].seriesName}：${isNaN(params[3].data)?'暂无':(params[3].data).toFixed(1)}
					 `;
    }
  },
  grid: {
    bottom: '18%',
    left: '18%'
  },
  yAxis: [{
    type: 'category',
    // axisTick: {
    // 	alignWithLabel: true
    // },
    minInterval: 100,
    data: []
  }, {
    type: 'category',
  }, {
    type: 'category',
  }, {
    type: 'category',
  }],
  xAxis: [{
      type: 'value',
      name: '温度',
      axisLine: {
        lineStyle: {
          color: colors[0]
        }
      },
      splitLine: {
        show: false
      },
    },
    {
      type: 'value',
      name: '湿度',
      position: 'bottom',
      offset: 20,
      axisLine: {
        lineStyle: {
          color: colors[1]
        }
      },
      splitLine: {
        show: false
      },
    },
    {
      type: 'value',
      name: '压强',
      position: 'top',
      axisLine: {
        lineStyle: {
          color: colors[2]
        }
      },
      splitLine: {
        show: false
      },
    },
    {
      type: 'value',
      name: '海拔',
      position: 'top',
      offset: 20,
      axisLine: {
        lineStyle: {
          color: colors[3]
        }
      },
      splitLine: {
        show: false
      },
    }
  ],
  dataZoom: [{
    id: 'dataZoomY',
    type: 'inside',
    yAxisIndex: [0],
    filterMode: '30%'
  }],
  series: [{
      name: '温度',
      type: 'line',
      data: []
    },
    {
      name: '湿度',
      type: 'line',
      xAxisIndex: 1,
      data: []
    },
    {
      name: '压强',
      type: 'line',
      xAxisIndex: 2,
      data: []
    },
    {
      name: '海拔',
      type: 'line',
      xAxisIndex: 3,
      data: []
    }
  ]
};
if (option && typeof option === "object") {
  myChart.setOption(option, true);
}
window.addEventListener('resize', () => {
  myChart.resize()
})

creatModel()
initData()
initModel()
init()

function initData() {
  // 重置状态栏
  station = {
    stationId: '--',
    sondeId: '--',
    lat: '--',
    lng: '--',
    height: '--',
    temperature: '--',
    humidity: '--',
    pressure: '--',
    freqz: '--',
    satellitesNum: '--',
    rssi: '--',
    nSpeed: '--',
    eSpeed: '--',
    vSpeed: '--',
    batteryVol: '--',
    boxTemperature: '--',
  }
  stateInfo.innerHTML =
    `<li>经度：--</li>
				<li>纬度：--</li>
				<li>海拔：--</li>
				<li>温度：--</li>
				<li>湿度：--</li>
				<li>气压：--</li>
				<li>频率值：--</li>
				<li>卫星数：--</li>
				<li>信号强度：--</li>
				<li>北向速度：--</li>
				<li>东向速度：--</li>
				<li>垂直速度：--</li>
				<li>电池电压：--</li>
				<li>盒内温度：--</li>`
  // gloabData=[];
  first = true;
}

function init() {
  nowState = [-1, -1, -1, -1];

  // 重置模型
  var timeInterval = new Cesium.TimeInterval({
    start: Cesium.JulianDate.fromDate(startTime),
    stop: Cesium.JulianDate.fromDate(endTime > endBallTime ? endTime : endBallTime),
    isStartIncluded: true,
    isStopIncluded: true,
  });
  ballPath.removeSamples(timeInterval)
  pathPosition.removeSamples(timeInterval)
  parachutePath.removeSamples(timeInterval)
  camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(107.5, 31.2, 10000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    }
  });

  dataObj = {};

  // 重置echart
  option.yAxis[0].data = [];
  option.series[0].data = [];
  option.series[1].data = [];
  option.series[2].data = [];
  option.series[3].data = [];
  myChart.setOption({
    series: [{
      data: option.series[0].data
    }, {
      data: option.series[1].data
    }, {
      data: option.series[2].data
    }, {
      data: option.series[3].data
    }],
    yAxis: [{
      data: option.yAxis[0].data
    }]
  });
}

// sondeidInfo.addEventListener('click', function(e) {
//   if (e.target.className == 'sondeIds' && e.target.dataset.value != ballNum) {
//     [].forEach.call(this.children, function(el) {
//       el.classList.remove('active')
//     });
//     gloabData = [];
//     e.target.classList.add('active');
//     ballNum = e.target.dataset.value;
//     changeBall = true;
//   }
// })

// getSondeIds()
// function getSondeIds() {
//   ajax({
//     url: `/simulate/getSondeIds`
//   }).then(res => {
//     sondeidInfo.innerHTM = '';
//     let str = res.sondeIds
//     str = str.substr(0, str.length - 1);
//     str = str.substr(1, str.length - 1);
//     let data = str.split(',');
//     if (data[0] != [""]) {
//       for (let i = 0; i < data.length; i++) {
//         sondeidInfo.innerHTML += `<div class='sondeIds' data-value='${data[i]}'>探空仪号  ${data[i]}</div>`
//       }
//     } else {
//       sondeidInfo.innerHTML = `<div>暂无数据</div>`
//     }
//   })
// }

// 全屏显示功能
// var docfull = false;
// fullScreen.addEventListener('click', function() {
//   docfull = !docfull;
//   var element = document.documentElement
//   if (docfull) {
//     fullScreen.innerText = '退出全屏';
//     if (element.requestFullscreen) {
//       element.requestFullscreen();
//     } else if (element.mozRequestFullScreen) {
//       element.mozRequestFullScreen();
//     } else if (element.webkitRequestFullscreen) {
//       element.webkitRequestFullscreen();
//     } else if (element.msRequestFullscreen) {
//       element.msRequestFullscreen();
//     }
//   } else {
//     fullScreen.innerText = '全屏显示';
//     if (document.exitFullscreen) {
//       document.exitFullscreen();
//     } else if (document.mozExitFullScreen) {
//       document.mozExitFullScreen();
//     } else if (document.webkitExitFullscreen) {
//       document.webkitExitFullscreen();
//     }
//   }
// })

function innerTxt(station) {
  if (isNaN(station.temperature) && isNaN(station.humidity) && isNaN(station.pressure)) {
    stateInfo.innerHTML =
      `<li>经度：--</li>
				<li>纬度：--</li>
				<li>海拔：--</li>
				<li>温度：--</li>
				<li>湿度：--</li>
				<li>气压：--</li>
				<li>频率值：--</li>
				<li>卫星数：--</li>
				<li>信号强度：--</li>
				<li>北向速度：--</li>
				<li>东向速度：--</li>
				<li>垂直速度：--</li>
				<li>电池电压：--</li>
				<li>盒内温度：--</li>`
  } else {
    stateInfo.innerHTML =
      `<li>经度：${station.lng=='--'?'--':(station.lng).toFixed(2)}</li>
				<li>纬度：${station.lat=='--'?'--':(station.lat).toFixed(2)}</li>
				<li>海拔：${isNaN(station.height)?'--':(station.height).toFixed(1)}</li>
				<li>温度：${isNaN(station.temperature)?'--':(station.temperature).toFixed(1)}</li>
				<li>湿度：${isNaN(station.humidity)?'--':parseInt(station.humidity)}</li>
				<li>气压：${isNaN(station.pressure)?'--':parseInt(station.pressure)}</li>
				<li>频率值：${station.freqz=='--'?'--':(station.freqz).toFixed(2)}</li>
				<li>卫星数：${station.satellitesNum=='--'?'--':station.satellitesNum}</li>
				<li>信号强度：${station.rssi=='--'?'--':station.rssi}</li>
				<li>北向速度：${station.nSpeed=='--'?'--':(station.nSpeed).toFixed(2)}</li>
				<li>东向速度：${station.eSpeed=='--'?'--':(station.eSpeed).toFixed(2)}</li>
				<li>垂直速度：${station.vSpeed=='--'?'--':(station.vSpeed).toFixed(2)}</li>
				<li>电池电压：${station.batteryVol=='--'?'--':(station.batteryVol).toFixed(2)}</li>
				<li>盒内温度：${station.boxTemperature=='--'?'--':station.boxTemperature}</li>`
  }
}

// 初始化模型
function creatModel() {
  path = viewer.entities.add({
    position: pathPosition,
    ellipsoid: {
      radii: new Cesium.Cartesian3(0.001, 0.001, 0.001),
      material: Cesium.Color.RED.withAlpha(0),
      outline: false,
    },
    path: {
      show: true,
      leadTime: 0,
      trailTime: 10000000,
      width: 5,
      resolution: 100,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        taperPower: 0.3,
        color: Cesium.Color.MEDIUMBLUE,
        taperPower: 1
      })
    },
  })
  var ballModel = viewer.entities.add({
    position: new Cesium.Cartesian3(0, 0, 0),
    show: false,
    model: {
      uri: '../mod/fly.glb',
      minimumPixelSize: 100,
      maximumScale: 5000
    },
  });
  ball = viewer.entities.add({
    position: ballPath,
    show: false,
    model: Cesium.clone(ballModel.model),
  });
  parachute = viewer.entities.add({
    position: new Cesium.Cartesian3(0, 0, 0),
    // position: parachutePath,
    show: false,
    model: {
      uri: '../mod/Parachute.glb',
      minimumPixelSize: 100,
      maximumScale: 5000
    },
  });
  ballFPoint = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
    show: false,
    ellipsoid: {
      radii: new Cesium.Cartesian3(0.2, 0.2, 0.2),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: false,
    },
    label: {
      text: '放球',
      font: "20px 微软雅黑",
      eyeOffset: new Cesium.Cartesian3(3, 0, 6),
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e4, 0.5),
    }
  });
  ballPPoint = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
    show: false,
    ellipsoid: {
      radii: new Cesium.Cartesian3(0.2, 0.2, 0.2),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: false,
    },
    label: {
      text: '平飘',
      font: "20px 微软雅黑",
      eyeOffset: new Cesium.Cartesian3(3, 0, 6),
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e4, 0.5),
    }
  });
  ballRPoint = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
    show: false,
    ellipsoid: {
      radii: new Cesium.Cartesian3(0.2, 0.2, 0.2),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: false,
    },
    label: {
      text: '熔断',
      font: "20px 微软雅黑",
      eyeOffset: new Cesium.Cartesian3(3, 0, 6),
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e4, 0.5),
    }
  });
}

function computeCircle(radius) {
  var positions = [];
  for (var i = 0; i < 360; i++) {
    var radians = Cesium.Math.toRadians(i);
    positions.push(
      new Cesium.Cartesian2(
        radius * Math.cos(radians),
        radius * Math.sin(radians)
      )
    );
  }
  return positions;
}
ajax({
  url: `../js/plan_path_20200719.geojson`
}).then(res => {
  let data = res.features[0].geometry.coordinates;
  let arr = [];
  data.forEach(function(el) {
    arr.push(el[0])
    arr.push(el[1])
    arr.push(el[2])
  })
  viewer.entities.add({
    polylineVolume: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(arr),
      shape: computeCircle(100.0),
      material: Cesium.Color.WHITE.withAlpha(0.7),
    },
  });
})

function initModel() {
  ball.show = false;
  // ball2.show=false;
  parachute.show = false;
  ballFPoint.show = false;
  ballPPoint.show = false;
  ballRPoint.show = false;
  viewer.trackedEntity = undefined;
}

// let sondeIdArr = [];
// let eb = new EventBus("/api/es/");
let eb = new EventBus("http://192.168.1.161:8087/eventbus/");
eb.onopen = function() {
  eb.registerHandler('addr_dd_sonde', function(err, msg) {
    // console.log(msg.body)
    if (msg.body) {
      let data = JSON.parse(msg.body)
      console.log(data)
      // if (ballNum==-1 && changeBall) {
      //   ballNum=data.sondeCode;
      //   changeBall=false;
      //   sondeidInfo.children[0].innerText = '站号：' + data.stationNum;
      //   sondeidInfo.children[1].innerText = '探空仪号：' + data.sondeCode;
      // }
      if (data.sondeCode == ballNum) {
        gloabData.push(data)
      }
      if (data.sondeCode && changeBall) {
        ballNum = data.sondeCode;
        changeBall = false;
        sondeidInfo.children[0].innerText = '站号：' + data.stationNum;
        sondeidInfo.children[1].innerText = '探空仪号：' + data.sondeCode;
      }
    }
  })
}

// 原点--探空仪连线

// creatLabel(112.3333, 16.8333)
// creatLabel(109.5833, 18.2333)
// creatpolyLine(112.3333, 16.8333)
// creatpolyLine(109.5833, 18.2333)

function creatLabel(lng, lat) {
  viewer.entities.add({
    position: new Cesium.CallbackProperty(function(time, result) {
      var position = Cesium.Cartesian3.fromDegrees(0, 0, 0)
      if (ball.position.getValue(time)) {
        linePosition = [ball.position.getValue(time), Cesium.Cartesian3.fromDegrees(lng, lat, 0)]
        var ellipsoid = viewer.scene.globe.ellipsoid;
        var cartesian3 = ball.position.getValue(time);
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var alt = cartographic.height;
        position = Cesium.Cartesian3.fromDegrees(lng + (lng - lng) / 2, lat + (lat - lat) / 2, (alt - 0) / 2)
      }
      return position
    }),
    label: {
      font: '20px sans-serif',
      // scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e5, 0.0),
      text: new Cesium.CallbackProperty(function(time, result) {
        var text = ''
        if (ball.position.getValue(time)) {
          var distance = Cesium.Cartesian3.distance(ball.position.getValue(time), Cesium.Cartesian3.fromDegrees(
            lng, lat, 0))
          var text = '' + parseInt(distance);
        }
        return text
      }),
    }
  })
}

function creatpolyLine(lng, lat) {
  viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(function(time, result) {
        if (ball.position.getValue(time)) {
          linePosition = [ball.position.getValue(time), Cesium.Cartesian3.fromDegrees(lng, lat, 0)]
        } else {
          linePosition = Cesium.Cartesian3.fromDegreesArrayHeights([0, 0, 0, 0, 0, 0])
        }
        return linePosition
      }),
      width: 2,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.DEEPSKYBLUE.withAlpha(0.3),
        glowPower: 0.25,
      }),
    },
  });
}

function creatCircle(x, y) {
  var arr = []
  for (let i = 1; i < 5; i++) {
    var greenCircle = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(x, y),
      ellipse: {
        semiMinorAxis: i * 50000,
        semiMajorAxis: i * 50000,
        height: 0.0,
        material: Cesium.Color.RED.withAlpha(0.1),
        outlineWidth: 3,
        outlineColor: Cesium.Color.WHITE.withAlpha(0.2),
        outline: true,
      }
    })
    arr.push(greenCircle)
  }
  return arr
}

function creatCroseText(x, y) {
  var pointer;
  var center = {
    x: x,
    y: y
  }
  pointer = comp(x, y, 50000, center, {
    x: 1,
    y: 0
  })
  creatTextLabel(pointer, '50')
  pointer = comp(x, y, 100000, center, {
    x: 1,
    y: 0
  })
  creatTextLabel(pointer, '100')
  pointer = comp(x + 1, y, 150000, center, {
    x: 1,
    y: 0
  })
  creatTextLabel(pointer, '150')
  pointer = comp(x + 1, y, 200000, center, {
    x: 1,
    y: 0
  })
  creatTextLabel(pointer, '200')
}

function creatTextLabel(point, txt) {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(point.x, point.y),
    label: {
      font: '20px sans-serif',
      pixelOffset: new Cesium.Cartesian2(10, 10),
      scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0.7),
      translucencyByDistance: new Cesium.NearFarScalar(7e5, 2.0, 1.5e6, 0),
      text: txt
    }
  })
}

// 绘制十字线
function drawLine(x1, y1, x2, y2) {
  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights([x1, y1, 0, x2, y2, 0]),
      width: 2,
      material: new Cesium.PolylineGlowMaterialProperty({
        color: Cesium.Color.DEEPSKYBLUE.withAlpha(0.3),
        glowPower: 0.25,
      }),
    },
  });
}

function drawCrose(x, y) {
  var pointer = {}
  var center = {
    x: x,
    y: y
  }
  pointer = comp(x - 1, y, 200000, center, {
    x: -1,
    y: 0
  })
  drawLine(pointer.x, pointer.y, x, y)
  pointer = comp(x + 1, y, 200000, center, {
    x: 1,
    y: 0
  })
  drawLine(pointer.x, pointer.y, x, y)
  pointer = comp(x, y + 1, 200000, center, {
    x: 0,
    y: 1
  })
  drawLine(pointer.x, pointer.y, x, y)
  pointer = comp(x, y - 1, 200000, center, {
    x: 0,
    y: -1
  })
  drawLine(pointer.x, pointer.y, x, y)
}

function comp(x, y, r, center, judge) {
  var distancesd = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(x, y, 0), Cesium.Cartesian3.fromDegrees(
    center.x, center.y, 0))
  if (distancesd >= r) {
    var point = {
      x: x,
      y: y
    }
    return point
  } else {
    var newx = judge.x < 0 ? x - 0.0002 : judge.x > 0 ? x + 0.0002 : x;
    var newy = judge.y < 0 ? y - 0.0002 : judge.y > 0 ? y + 0.0002 : y;
    return comp(newx, newy, r, center, judge)
  }
}

setInterval(function() {
  if (gloabData.length != 0) {
    // for (var i=0; i<gloabData.length; i++){
    let data = gloabData[0];
    console.log(data)
    // 切换路径
    if (ballNum == -1) {
      ballNum = data.sondeCode;
      station.sondeId = data.sondeCode;
      changeBall = true;
      first = true;
      seltSondeId.innerText = '探空仪号：' + ballNum;
    }
    if (ballNum == data.sondeCode && changeBall) {
      console.log('切换路线ing...')
      init()
      initData()
      // getSondeIds()
      changeBall = false;
      // gloabData=[];
      first = true;
      station.sondeId = ballNum;
    }

    if (data.sondeCode == ballNum && gloabData.length != 0) {
      station = {
        stationId: data.stationId || "--",
        sondeId: data.sondeCode,
        lng: data.longitude || "--",
        lat: data.latitude || "--",
        height: data.aboveSeaLevel || NaN,
        temperature: data.temperature || NaN,
        humidity: data.humidity || NaN,
        pressure: data.pressure || NaN,
        freqz: data.freqz || "--",
        satellitesNum: data.satelliteCount || "--",
        rssi: data.rssi || "--",
        nSpeed: data.nSpeed || "--",
        eSpeed: data.eSpeed || "--",
        vSpeed: data.raisingSpeed || "--",
        batteryVol: data.batteryVol || "--",
        boxTemperature: data.boxTemperature || "--",
      }
      // console.log(station)
      innerTxt(station)
      info.innerHTML = `
				<div>站号: ${station.stationId}</div>
				<div>探空仪号: ${station.sondeId}</div>
				`
      if (first) {
        first = false;
        init()
        clearInterval(ball2Time)
        clock.multiplier = 1;
        startTime = new Date();
        endTime = new Date();
        initModel()
        ball.show = true;
        clock.currentTime = Cesium.JulianDate.fromDate(endTime)

        // ball.position = Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.aboveSeaLevel)
        // ball.position = ballPath;
        viewer.trackedEntity = path;
        sondeTime = data.seconds * 1000
      }

      if (dataObj.sondeCode) {
        if (data.longitude && data.latitude && data.aboveSeaLevel && data.longitude != 0 && data.latitude != 0 && data.aboveSeaLevel != 0) {
          endTime = new Date();
          let position1 = Cesium.Cartesian3.fromDegrees(dataObj.longitude, dataObj.latitude, dataObj.aboveSeaLevel);
          if (nowState[2] == 1) {
            parachutePath.addSample(Cesium.JulianDate.fromDate(endTime), position1);
          }
          if (nowState[2] != 1) {
            ballPath.addSample(Cesium.JulianDate.fromDate(endTime), position1);
          }
          pathPosition.addSample(Cesium.JulianDate.fromDate(endTime), position1);

          endTime = new Date(endTime.getTime() + 1000);
          let position2 = Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.aboveSeaLevel);
          if (nowState[2] == 1) {
            parachutePath.addSample(Cesium.JulianDate.fromDate(endTime), position2);
          }
          if (nowState[2] != 1) {
            ballPath.addSample(Cesium.JulianDate.fromDate(endTime), position2);
          }
          pathPosition.addSample(Cesium.JulianDate.fromDate(endTime), position2);
        }

        // echarts
        sondeTime += 1000;
        var hours = new Date(sondeTime).getHours()
        var minutes = new Date(sondeTime).getMinutes()
        var seconds = new Date(sondeTime).getSeconds()
        if (isNaN(station.temperature) && isNaN(station.humidity) && isNaN(station.pressure)) {
          option.series[0].data.push(NaN)
          option.series[1].data.push(NaN)
          option.series[2].data.push(NaN)
          option.series[3].data.push(NaN)
        } else {
          option.series[0].data.push(station.temperature)
          option.series[1].data.push(station.humidity)
          option.series[2].data.push(station.pressure)
          option.series[3].data.push(station.height)
        }
        option.yAxis[0].data.push(
          `${hours<10?'0'+hours:hours}:${minutes<10?'0'+minutes:minutes}:${seconds<10?'0'+seconds:seconds}`
        )
        myChart.setOption({
          series: [{
            data: option.series[0].data
          }, {
            data: option.series[1].data
          }, {
            data: option.series[2].data
          }, {
            data: option.series[3].data
          }],
          yAxis: [{
            data: option.yAxis[0].data
          }]
        });
      }
      dataObj = data;

      gloabData.shift()
      if (gloabData.length < 1) {
        dataObj.temperature = NaN;
        dataObj.humidity = NaN;
        dataObj.pressure = NaN;
        gloabData.push(dataObj)
      }
    }
  }
}, 1000)
