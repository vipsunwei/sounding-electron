(()=>{
  const stationNum = getParams('stationNum') || '57494';
  const getData = document.querySelector('.getData');
  const equipment = document.querySelector('.equipment');
  // 获取传参
  function getParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
      return unescape(r[2]);
    }
    return null;
  };

  if (!stationNum) {
    // alert('未知站号')
    document.body.innerHTML='<div class="abnormal">站号获取异常!</div>';
  } else {
    // 参数设置
    const baseUrl = 'http://192.168.1.161:8080';
    const baseEventUrl = 'http://192.168.1.161:8087/eventbus/';
    // const baseUrl = '/api/device/fuse';
    let dataUUID = {
      id: {UUID: setUUID()},
      qz: {UUID: setUUID()},
      YSRPSN: {UUID: setUUID()},
      fixedLength: {UUID: setUUID()},
      swichAfc: {UUID: setUUID()},
      freq: {UUID: setUUID()},
      swichScan: {UUID: setUUID()},
      bandWidth: {UUID: setUUID()},
      sondeNum: {UUID: setUUID()},
      YBMBSN: {UUID: setUUID()},
      sondeFreq: {UUID: setUUID()},
      fuseFreq: {UUID: setUUID()},
      setFuseFreq: {UUID: setUUID()},
      setSondeFreq: {UUID: setUUID()},
    }
    /*
    * @param  {Boolean} globalSwitch 判断条件
    * @param  {Boolean} startBall 放球指令判断
    * @param  {Boolean} FuseLink 熔断器连接判断
    * @param  {Boolean} SondeLink 探空仪连接判断
    * @param  {Number} FuseFreq  熔断器设置参数
    * @param  {Number} SondeFreq 探空仪设置参数
    * @param  {Boolean} baseOpend 基测箱是否处于打开状态
    * @param  {Boolean} startBaseClick 是否开始基测
    * @param  {Boolean} readyLink 连接通道是否建立
    */
    let globalSwitch=true,
        startBall=true,
        FuseLink=false,
        SondeLink=false,
        FuseFreq=0,
        SondeFreq=0,
        baseOpend=false,
        startBaseClick=true,
        readyLink=false,
        linekTime=0;
    let baseState={stateNum: -1, animate: true};
    let idItem = {
      YBMB: {},
      YSRP: {},
      YIRC: {}
    }
    let pageData = {
      fixedType: {value: '', initial: '', work: false},
      fixedLength: {value: '', initial: '', work: false},
      swichAfc: {value: '', initial: '', work: false},
      freq: {value: [], initial: [], work: false},
      swichScan: {value: '', initial: '', work: false},
      bandWidth: {value: '', initial: '', work: false},
      bandCenter: {value: '', initial: '', work: false},
    }
    let sondeArr={
        time: [],
        temperature: [],
        humidity: [],
        pressure: []
      };
      let baseArr={
        time: [],
        temperature: [],
        humidity: [],
        pressure: []
      };
    let baseData=[],sondeData=[],spectrumArr=[];
    // DOM获取
    let $ = (el)=>{
      return document.querySelectorAll(el).length==1?document.querySelector(el):document.querySelectorAll(el)
    }

    let groundReceiver = document.querySelector('.groundReceiver').querySelectorAll('.table-li');
    let spectrometer = document.querySelector('.spectrometer').querySelectorAll('.table-li');
    let sonde = document.querySelector('.sonde').querySelectorAll('.table-li');
    let baseTestCases = document.querySelector('.baseTestCases').querySelectorAll('.table-li');
    let record = document.querySelector('.record').querySelectorAll('input');
    let recordArea = document.querySelector('.record').querySelector('textarea');
    let spectrometerChart = echarts.init(document.getElementById('freqCharts'));

    let nextBtn = document.querySelector('.nextBtn'),
        backBtn = document.querySelector('.backBtn'),
        startBtn = document.querySelector('.startBtn'),
        submitBtn = document.querySelector('.submitBtn'),
        trans = document.querySelector('.trans');
        navice = document.querySelector('.m-navice'),
        aside = document.querySelector('.m-aside'),
        chartBox = document.querySelector('.chartBox'),
        tableFusingPoint = document.querySelector('.tableFusingPoint'),
        tableSondePoint = document.querySelector('.tableSondePoint'),
        fusingPoint = document.querySelector('.fusingPoint'),
        sondePoint = document.querySelector('.sondePoint'),
        infoTitle = document.querySelector('.infoState').querySelector('.title');

		if (globalSwitch) {
			ajax({
				url: baseUrl + '/getDeviceState'
			}).then(res => {
				res.forEach(el=>{
          console.log(el)
					if (el.YBMB && el.YBMB.stationNum===stationNum) {
						// 基测箱
						idItem.YBMB.sn = el.YBMB.sn;
						idItem.YBMB.ids = el.YBMB.id;
						equipment.children[0].querySelector('span').style.background='green';
					}
					if (el.YSRP && el.YSRP.stationNum===stationNum) {
						// 地面接收机
						idItem.YSRP.sn = el.YSRP.sn;
						idItem.YSRP.ids = el.YSRP.id;
						equipment.children[2].querySelector('span').style.background='green';
					}
					if (el.YIRC && el.YIRC.stationNum===stationNum) {
						// 远程控制器
						idItem.YIRC.sn = el.YIRC.sn;
						idItem.YIRC.ids = el.YIRC.id;
						equipment.children[1].querySelector('span').style.background='green';
					}
          getLine()
				})
			})
      .catch(function(err) {
        getData.innerText='数据获取失败请重试';
      })
		} else{
			getData.style.display='none';
		}
    var lineClock
    function getLine(){
      lineClock = setTimeout(function(){
        linekTime++;
        if (!readyLink) {
          ajax({
            url: baseUrl + '/getqz?id=' + idItem.YSRP.ids + '&type=YSRP'+'&UUID='+dataUUID.qz.UUID + '&Sn=' + idItem.YSRP.sn,
          }).then(res => {
            // readyLink=true;
            getData.style.display='none';
            clearTimeout(lineClock)
            console.log(res)
          })
          if (linekTime<3) {
            getLine()
          } else{
            clearTimeout(lineClock)
            getData.innerText='数据获取失败请检查网络';
          }
        } else {
          clearTimeout(lineClock)
        }
      },5000)
    }
    // 生成UUID
    function setUUID() {
      var s = [];
      var hexDigits = "0123456789abcdef";
      for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
      }
      s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
      s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
      s[8] = s[13] = s[18] = s[23] = "-";

      var uuid = s.join("");
      return uuid;
    }
    // 处理时间函数
    function getTimes(time) {
      var years = new Date(time).getFullYear(),
			months = new Date(time).getMonth()+1,
			days = new Date(time).getDate(),
			hours = new Date(time).getHours(),
			minute = new Date(time).getMinutes(),
			secound = new Date(time).getSeconds(),
			msecound = new Date(time).getMilliseconds();
      months=months<10?'0'+months:months;
      days=days<10?'0'+days:days;
      hours=hours<10?'0'+hours:hours;
      minute=minute<10?'0'+minute:minute;
      secound=secound<10?'0'+secound:secound;
      msecound=msecound<10?'0'+msecound:msecound;
      return {
        'year': years,
        'month': months,
        'day': days,
        'hour': hours,
        'minute': minute,
        'secound': secound,
        'msecound': msecound
      }
    }
    // ajax函数
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

    var step = new Step('.step', {
      // length: trans.children.length,
      successColor: 'rgb(255 255 255)',
      defultColor: 'rgb(3 29 66)',
      title: ['地面接收机数值检查', '频谱仪数值检查', '基测箱数值检查', '探空仪数值检查', '基测状态查询', '开始放球', '气球施放实验登记']
    });

    function resizeBox() {
      trans.style.transform = `translateX(-${step.getSchedule()*trans.parentNode.offsetWidth}px)`;
      trans.style.width = trans.parentNode.offsetWidth * trans.children.length + 'px';
      for (var i = 0; i < trans.children.length; i++) {
        trans.children[i].style.width = trans.parentNode.offsetWidth + 'px';
      }
    }
    resizeBox()
    window.addEventListener('resize', function() {
      resizeBox()
    })
    // step.setSchedule(1)
    // step.click(function(){
    // 	console.log(step.returnValue)
    // })

    backBtn.addEventListener('click', function() {
      step.back();
      trans.style.transform = `translateX(-${step.getSchedule()*trans.parentNode.offsetWidth}px)`;
      backBtn.style.cursor='pointer';
      if (step.getSchedule() == 0) {
        backBtn.style.cursor='no-drop';
      }
      if (step.getSchedule()>=1 && step.getSchedule()<4) {
        $('#freqCharts').style.display='block';
        spectrometerChart.resize();
      } else {
        $('#freqCharts').style.display='none';
      }
      if (globalSwitch) {
        setData();
      }
    })
    nextBtn.addEventListener('click', function() {
      step.next();
      backBtn.style.cursor='pointer';
      if (step.getSchedule() == 0) {
        backBtn.style.cursor='no-drop';
      }
      trans.style.transform = `translateX(-${step.getSchedule()*trans.parentNode.offsetWidth}px)`;
      if (step.getSchedule()>=4) {
        startBtn.style.display='block';
        backBtn.style.display='none';
        nextBtn.style.display='none';
      }
      if (step.getSchedule()>=1 && step.getSchedule()<4) {
        $('#freqCharts').style.display='block';
        spectrometerChart.resize();
      } else {
        $('#freqCharts').style.display='none';
      }
      if (globalSwitch) {
        if (FuseLink && step.getSchedule()==2) {
          step.back();
          alert('请检测熔断器是否连接')
        } else if (SondeLink && step.getSchedule()==3) {
          step.back();
          alert('请检测探空仪是否连接')
        }
        setData();
        if (step.getSchedule()===1) {
          pageData.fixedType.value=groundReceiver[2].querySelector('.input').value;
          pageData.fixedType.value=groundReceiver[3].querySelector('.input').value;
          if (document.querySelector('#openAFC').checked) {
            pageData.swichAfc.value=1;
          } else {
            pageData.swichAfc.value=0;
          }
          pageData.freq.value=[];
          for (let i = 0; i < 8; i++) {
            pageData.freq.value.push(groundReceiver[5 + i].querySelector('.input').value);
          }

          // if (pageData.fixedType.value != pageData.fixedType.initial && pageData.swichAfc.work || pageData.fixedLength.value != pageData.fixedLength.initial && pageData.swichAfc.work) {
          //   ajax({url:baseUrl+'/setfixedLength?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setFuseFreq.UUID+'&TF='+pageData.fixedType.value+'&length='+pageData.fixedLength.value})
          //   .then(function (res) {
          //     console.log(res);
          //   })
          // }

          // if (pageData.swichAfc.value != pageData.swichAfc.initial && pageData.swichAfc.work) {
          //   ajax({url:baseUrl+'/setswichAfc?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setFuseFreq.UUID+'&TF='+pageData.fixedType.value})
          //   .then(function (res) {
          //     console.log(res);
          //   })
          // }

          // pageData.freq.value.forEach(function(el){
          //   if (el.value != el.initial && pageData.freq.work) {
              ajax({url:baseUrl+'/setfreq?id='+idItem.YSRP.ids+'&channalnumber=1&UUID='+dataUUID.setFuseFreq.UUID+'&data='+pageData.freq.value[0]+'&Sn='+idItem.YSRP.sn})
              .then(function (res) {
                console.log(res);
              })
          //   }
          // })

        } else if (step.getSchedule()===2) {
          if (document.querySelector('#openRate').checked) {
            pageData.swichScan.value=0
          } else {
            pageData.swichScan.value=1
          }
          if (document.querySelector('#BANDWIDTH1').checked) {
            pageData.bandCenter.initial = 1;
          } else if (document.querySelector('#BANDWIDTH3').checked) {
            pageData.bandCenter.initial = 3;
          } else if (document.querySelector('#BANDWIDTH6').checked) {
            pageData.bandCenter.initial = 6;
          }
          pageData.bandWidth.value=document.querySelector('.bwFreqInt').value;

          if (pageData.swichScan.value != pageData.swichScan.initial && pageData.swichScan.work) {
            ajax({url:baseUrl+'/setswichScan?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setFuseFreq.UUID+'&TF='+pageData.swichScan.value})
            .then(function (res) {
              console.log(res);
            })
          }
          if (pageData.bandWidth.value != pageData.bandWidth.initial && pageData.bandWidth.work &&
              pageData.bandCenter.value != pageData.bandCenter.initial && pageData.bandCenter.work) {
            ajax({url:baseUrl+'/setbandWidth?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setFuseFreq.UUID+'&bandType='+pageData.bandWidth.value+'&data='+pageData.bandCenter.value})
            .then(function (res) {
              console.log(res);
            })
          }

        } else if (step.getSchedule()===3) {
          ajax({url:baseUrl+'/setfuseFreq?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setFuseFreq.UUID+'&data='+FuseFreq+'&Sn='+idItem.YBMB.sn})
          .then(function (res) {
            console.log(res);
          })
        } else if (step.getSchedule()===4) {
          ajax({url:baseUrl+'/setsondeFreq?id='+idItem.YBMB.ids+'&UUID='+dataUUID.setSondeFreq.UUID+'&data='+SondeFreq+'&Sn='+idItem.YBMB.sn})
          .then(function (res) {
            console.log(res);
          })
        }
      }
    })
    spectrometerOption = {
      // color: '#fff',
      title: {
        textStyle: {
          color: '#fff',
        },
        text: '频谱仪频率图'
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          return '频率：'+params[0].axisValue+'MHz  强度：'+params[0].value
        },
        axisPointer: {
          animation: false
        }
      },
      xAxis: {
        type: 'category',
        data: [],
        axisLabel: {
          margin: 10,
          interval: 100000,
          showMinLabel: true,
          showMaxLabel: true,
          textStyle: {
            color: '#999',
            fontSize: 12,
          }
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#fff'
          }
        }
      },
      series: [{
        data: [],
        type: 'line',
        smooth: true,
        markPoint: {
          data: [{
            type: 'max',
            name: '最大值',
            label:{
              formatter(params){
                // console.log(params)
                params.data.value = spectrumArr[params.data.coord[0]]+'MHz'
              }
            }
          }]
        },
      }]
    };
    spectrometerChart.setOption(spectrometerOption);
    window.addEventListener("resize", () => {
      spectrometerChart.resize();
    });

    var baseChartDom = document.querySelector('#baseChart');
      var baseChart = echarts.init(baseChartDom);
      var option = null;
      var colors = ['#5793f3', '#4B7CCB', '#27430A', '#21360A', '#FFF500', '#FFD600'];
      baseChartOption = {
        // color: colors,

        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        },
        legend: {
          textStyle: {
            color: '#fff'
          },
          data: ['基测箱温度', '探空仪温度', '基测箱湿度', '探空仪湿度', '基测箱气压', '探空仪气压']
      },
        // grid: {
        //   bottom: '8%',
        //   left: '8%'
        // },
        xAxis: [{
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            lineStyle: {
              color: colors[0]
            }
          },
        }, {
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitArea: {
            show: false
          }
        }, {
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitArea: {
            show: false
          }
        }, {
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitArea: {
            show: false
          }
        }, {
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitArea: {
            show: false
          }
        }, {
          type: 'category',
          minInterval: 100,
          data: [],
          axisLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          splitArea: {
            show: false
          }
        }],
        yAxis: [{
            // scale: true,
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
            // scale: true,
            type: 'value',
            name: '温度',
            axisLine: {
              lineStyle: {
                color: colors[2]
              }
            },
            splitLine: {
              show: false
            },
            // show: false
          },
          {
            // scale: true,
            type: 'value',
            name: '湿度',
            position: 'right',
            offset: 20,
            axisLine: {
              lineStyle: {
                color: colors[3]
              }
            },
            splitLine: {
              show: false
            },
          },
          {
            // scale: true,
            type: 'value',
            name: '湿度',
            position: 'right',
            offset: 20,
            axisLine: {
              lineStyle: {
                color: colors[3]
              }
            },
            splitLine: {
              show: false
            },
            // show: false
          },
          {
            // scale: true,
            type: 'value',
            name: '气压',
            position: 'right',
            axisLine: {
              lineStyle: {
                color: colors[4]
              }
            },
            splitLine: {
              show: false
            },
          },
          {
            // scale: true,
            type: 'value',
            name: '气压',
            position: 'right',
            axisLine: {
              lineStyle: {
                color: colors[5]
              }
            },
            splitLine: {
              show: false
            },
            // show: false
          },
        ],
        dataZoom: [{
          id: 'dataZoomX',
          type: 'inside',
          xAxisIndex: [0],
          filterMode: '30%'
        }],
        series: [{
            name: '基测箱温度',
            type: 'line',
            data: []
          },
          {
            name: '探空仪温度',
            type: 'line',
            yAxisIndex: 1,
            data: []
          },
          {
            name: '基测箱湿度',
            type: 'line',
            yAxisIndex: 2,
            data: []
          },
          {
            name: '探空仪湿度',
            type: 'line',
            yAxisIndex: 3,
            data: []
          },
          {
            name: '基测箱气压',
            type: 'line',
            yAxisIndex: 4,
            data: []
          },
          {
            name: '探空仪气压',
            type: 'line',
            yAxisIndex: 5,
            data: []
          }
        ]
      };
      if (baseChartOption && typeof baseChartOption === "object") {
        baseChart.setOption(baseChartOption, true);
      }
      window.addEventListener('resize', () => {
        baseChart.resize()
      })
      baseChart.resize()

    startBtn.addEventListener('click', function() {
      if (!globalSwitch) {
        step.next()
      }
      if (startBall) {
        step.next()
        trans.style.transform = `translateX(-${step.getSchedule()*trans.parentNode.offsetWidth}px)`;
        startBtn.style.display='none';
        submitBtn.style.display = 'block';
        let times = getTimes(new Date())
        record[0] = `${times.year} 年 ${times.month} 月 ${times.day} 日 ${times.hour} 时 ${times.minute} 分`;
      }
    })
    submitBtn.addEventListener('click', function() {
      navice.style.display='none';
      aside.style.left = '-200px';
      chartBox.children[0].style.left = '3vw';
      chartBox.children[1].style.left = '3vw';
      chartBox.children[2].style.right = '3vw';
      chartBox.children[3].style.right = '3vw';
      infoTitle.style.top = 0;
      ajax({url:`http://demo.r7tec.com/project/TK_BOBSYDJ.update.do?GCTIME=${record[0].value}&NQWEIGHT=${record[1].value}&CQZWEIGHT=${record[2].value}&YQSZWEIGHT=${record[3].value}&WQCYWEIGHT=${record[4].value}&NIGHTLEVEL=${record[5].value}&NQLL=${record[6].value}&NQLLYQXS=${record[7].value}&SONDECODE=${record[8].value}&WQWEIGHT=${record[9].value}&WQLL=${record[10].value}&PZWEIGHT=${record[11].value}&JJL=${record[12].value}&WQLLXS=${record[13].value}&TQMESSAGE=${record[14].value}&BEIZHU=${record[15].value}&YL=${record[16].value}&YZ=${record[17].value}&FX=${record[18].value}&FENGS=${record[19].value}&TQXX=${record[20].value}&NJD=${record[21].value}&WD=${record[22].value}&SD=${record[23].value}&YALI=${record[24].value}&ZBJS=${recordArea.value}`})
      .then(function (res) {
        console.log(res);
      })
    })

    $('.fusingBtn').addEventListener('click', function() {
      $('.checkFusing').children[1].innerText='熔断器检测中...';
      $('.checkFusing').children[1].style.display='inline-block';
      ajax({url:baseUrl + '/getfuseFreq?id=' + idItem.YBMB.ids+'&UUID='+dataUUID.fuseFreq.UUID+ '&Sn=' + idItem.YBMB.sn})
      .then(function (res) {
        console.log(res);
      })
    })
    $('.sondeBtn').addEventListener('click', function() {
      $('.checkSonde').children[1].innerText='探空仪检测中...';
      $('.checkSonde').children[1].style.display='inline-block';
      ajax({
        url: baseUrl + '/getsondeFreq?id=' + idItem.YBMB.ids+'&UUID='+dataUUID.sondeFreq.UUID+ '&Sn=' + idItem.YBMB.sn
      }).then(res => {
        console.log(res)
      })
    })
    tableFusingPoint.addEventListener('click', function(e) {
      fusingPoint.children[0].value = '工作频点'+e.target.dataset.index+':'+FuseFreq;
      this.style.display = 'none';
    })
    tableSondePoint.addEventListener('click', function(e) {
      sondePoint.children[0].value = '工作频点'+e.target.dataset.index+':'+SondeFreq;
      this.style.display = 'none';
    })
    fusingPoint.children[0].addEventListener('focus', function() {
      tableFusingPoint.style.display = 'block';
    })
    sondePoint.children[0].addEventListener('focus', function() {
      tableSondePoint.style.display = 'block';
    })
    fusingPoint.children[0].addEventListener('blur', function() {
      tableFusingPoint.style.display = 'none';
    })
    sondePoint.children[0].addEventListener('blur', function() {
      tableSondePoint.style.display = 'none';
    })
		$('.openSpec').addEventListener('click', function() {
		  baseOpend=true;
		  ajax({
		  	url: baseUrl + '/powerUp?id='+idItem.YSRP.ids+'&Sn='+idItem.YSRP.sn+'&UUID=123'
		  }).then(res => {
		    console.log(res)
		  })
		})
		$('.closeSpec').addEventListener('click', function() {
		  baseOpend=false;
		  ajax({
		  	url: baseUrl + '/powerDown?id='+idItem.YSRP.ids+'&Sn='+idItem.YSRP.sn+'&UUID=123'
		  }).then(res => {
		    console.log(res)
		  })
		})
    $('.openBase').addEventListener('click', function() {
      baseOpend=true;
      ajax({
      	url: baseUrl + '/powerUp?id='+idItem.YSRP.ids+'&Sn='+idItem.YSRP.sn+'&UUID=123'
      }).then(res => {
        console.log(res)
      })
    })
    $('.closeBase').addEventListener('click', function() {
      baseOpend=false;
      ajax({
      	url: baseUrl + '/powerDown?id='+idItem.YSRP.ids+'&Sn='+idItem.YSRP.sn+'&UUID=123'
      }).then(res => {
        console.log(res)
      })
    })
    $('.startBase').addEventListener('click', function() {
      if (startBaseClick && baseOpend) {
        startBaseClick=false;
        this.style.cursor = 'no-drop';
        // baseState.stateNum=3;
        // baseState.animate=true;
        // $('.baseTxt').innerText="当前基测状态：基测不合格，请更换探空仪后重新开始基测，5秒后跳转";
        // turnBack()
        ajax({url:baseUrl + '/sendStartCheck?id=' + idItem.YBMB.ids+'&Sn=' + idItem.YBMB.sn})
        .then(function (res) {
          console.log(res);
        })
      } else {
        alert('请检查基测箱开关是否打开')
      }
    })
    function turnBack() {
      var i=5;
      $('.baseLine').children[0].style.transition="width 1s 0s ease-in-out";
      $('.baseLine').children[0].style.width="0%";
      var turnClock = setInterval(function(){
        i--;
        if (i<=0) {
          clearInterval(turnClock)
          step.back().back()
          trans.style.transform = `translateX(-${step.getSchedule()*trans.parentNode.offsetWidth}px)`;
          $('.baseTxt').innerText="当前基测状态：基测未开始，请开始基测";
          $('.startBase').style.cursor = 'pointer';
          startBaseClick=true;
          startBtn.style.display='none';
          backBtn.style.display='block';
          nextBtn.style.display='block';
          $('.checkFusing').children[1].style.display='none';
          $('.checkSonde').children[1].style.display='none';
          $('.chooseFusingPoint').style.display='none';
          $('.chooseSondePoint').style.display='none';
        } else{
          $('.baseTxt').innerText="当前基测状态：基测不合格，请更换探空仪后重新开始基测，"+i+"秒后跳转";
        }
      },1000)
    }

    // 命令获取
    var order = new EventBus(baseEventUrl);
    // var order = new EventBus("/device/es/");
    order.onopen = function() {
      order.registerHandler('basic_test_response', function(err, msg) {
        //1:正在基测；2:基测合格；3:基测不合格;4:无法获取探空仪编号;5:探空仪类型不正确;6:无法获取探空仪数据;7:无法获取机测箱数据;08:基测失败（其它）;9:待机状态;
        let data = msg.body;
        console.log(data)
        if (data.BasicTestState.typeid==1 && data.BasicTestState.sn==idItem.YBMB.sn) {
          $('.baseTxt').innerText="当前基测状态：正在基测中...";
            baseState.stateNum = 1;
          if (baseState.animate) {
            baseState.animate=false;
            $('.baseLine').children[0].style.transition="width 300s 0s ease-in-out";
            $('.baseLine').children[0].style.width=87*0.9+"%";
          }
        } else if (data.BasicTestState.typeid==2 && data.BasicTestState.sn==idItem.YBMB.sn) {
          $('.baseTxt').innerText="当前基测状态：基测完成";
          baseState.animate=true;
          step.next();
          startBtn.style.cursor='pointer';
          startBall=true;
          baseState.stateNum=2;
          $('.baseLine').children[0].style.transition="width 3s 0s ease-in-out";
          $('.baseLine').children[0].style.width=89+"%";
        } else if (data.BasicTestState.typeid==3 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：基测不合格，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==4 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：无法获取探空仪编号，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==5 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：探空仪类型不正确，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==6 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：无法获取探空仪数据，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==7 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：无法获取机测箱数据，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==8 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：基测失败，请更换探空仪后重新开始基测，5秒后跳转";
          turnBack()
        } else if (data.BasicTestState.typeid==9 && data.BasicTestState.sn==idItem.YBMB.sn) {
          baseState.stateNum=3;
          baseState.animate=false;
          $('.baseTxt').innerText="当前基测状态：待机状态，未开始基测";
          turnBack()
        }
      })
      order.registerHandler('commond_response', function(err, msg) {
        var timed = setTimeout(function(){
          clearTimeout(timed)
          let msgData = msg.body;
          console.log(msgData)

          // console.log(msgData)
          /*
           * 地面接收机
           * 获取ID
           * 站点编号(QZ)
           * 设备序列号(SN)
           * 定长数据类型(FIXEDLENGTH)
           * AFC开关(SWITCHAFC)
           * 工作频点1-8(FREQ)
           */
          if (dataUUID.qz.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
            // console.log('站点编号:')
            // console.log(msgData)
            if (!readyLink) {
              readyLink=true;
              clearTimeout(lineClock)
              setData();
              groundReceiver[1].querySelector('.input').value = idItem.YSRP.sn;
              spectrometer[0].querySelector('.input').value = idItem.YSRP.sn;
              baseTestCases[0].querySelector('.input').value = idItem.YBMB.sn;
            }
            stationID = msgData.detect.deviceNumber;
            groundReceiver[0].querySelector('.input').value = msgData.detect.deviceNumber;
          }
          if (dataUUID.fixedLength.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
            // console.log('定长数据类型:+定长数据长度')
            // console.log(msgData)
            groundReceiver[2].querySelector('.input').value = msgData.detect.flLength;
            groundReceiver[3].querySelector('.input').value = msgData.detect.flLength;
            pageData.fixedType.initial=msgData.detect.flLength;
            pageData.fixedLength.initial=msgData.detect.flLength;
          }
          // if (dataUUID.swichAfc.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
          //   // console.log('AFC开关:')
          //   // console.log(msgData)
          //   if (msgData.detect.onOrOff == 1) {
          //     document.querySelector('#openAFC').checked = true;
          //     pageData.swichAfc.initial=1
          //   } else if (msgData.detect.onOrOff == 0) {
          //     document.querySelector('#closeAFC').checked = true;
          //     pageData.swichAfc.initial=0
          //   }
          // }
          if (dataUUID.freq.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
            // console.log('工作频点1-8:')
            // console.log(msgData)
            // if (msgData.detect.allChannelFreq!=null) {
            //   arrFREQ = [msgData.detect.allChannelFreq[0], msgData.detect.allChannelFreq[1]];
            //   var txt='';
            //   for (let i = 0; i < 8; i++) {
            //     groundReceiver[5 + i].querySelector('.input').value = msgData.detect.allChannelFreq[i];
            //     txt+=`<li data-index = "${i+1}">工作频点${i+1}:${msgData.detect.allChannelFreq[i]}</li>`;
            //     pageData.freq.initial.push(msgData.detect.allChannelFreq[i])
            //   }
            //   $('.tableFusingPoint').innerHTML=txt;
            //   $('.tableSondePoint').innerHTML=txt;
            // } else{
            groundReceiver[5].querySelector('.input').value = msgData.detect.channelFreq;
            // }
          }

          /*
           * 频谱仪
           * 获取ID
           * 设备序列号
           * 扫频开关(SWITCHSCAN)
           * 扫频参数(BANDWIDTH)
           * 中心频点(BANDWIDTH)
           */
          // if (dataUUID.swichScan.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
          //   console.log('扫频开关:')
          //   console.log(msgData)
          //   if (msgData.detect.onOrOff == 0) {
          //     document.querySelector('#openRate').checked = true;
          //     pageData.swichScan.initial=0
          //   } else {
          //     document.querySelector('#closeRate').checked = true;
          //     pageData.swichScan.initial=1
          //   }
          // }
          // if (dataUUID.bandWidth.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
          //   console.log('扫频参数:')
          //   console.log(msgData)
          //   if (msgData.detect.bwType == "1") {
          //     document.querySelector('#BANDWIDTH1').checked = true;
          //     pageData.bandWidth.initial = 1;
          //   } else if (msgData.detect.bwType == "3") {
          //     document.querySelector('#BANDWIDTH3').checked = true;
          //     pageData.bandWidth.initial = 3;
          //   } else if (msgData.detect.bwType == "6") {
          //     document.querySelector('#BANDWIDTH6').checked = true;
          //     pageData.bandWidth.initial = 6;
          //   }
          //   document.querySelector('.bwFreqInt').value = msgData.detect.bwFreqInt;
          //   pageData.bandCenter.initial = msgData.detect.bwFreqInt;
          // }
          /*
           * 基测箱设置
           * 探空仪编号(SONDE_NUM)
           * 设备序列号(SN)
           */
          if (dataUUID.sondeNum.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
            console.log('探空仪编号:')
            soundID=msgData.detect.sondeNum;
            sonde[0].querySelector('.input').value = msgData.detect.sondeNum;
            record[8].value = msgData.detect.sondeNum;
          }
          // if (dataUUID.YBMBSN.UUID == msgData.serviceUUID && msgData.communicatStatus==="SUCCESS") {
          //   console.log('设备序列号:')
          //   console.log(msgData)
          //   baseTestCases[1].querySelector('.input').value = msgData.detect.sn;
          // }
          /*
           * 探空仪编号
           * 工作频点(SONDE_FREQ)
           */
          // 熔断器检测
          if (dataUUID.fuseFreq.UUID == msgData.serviceUUID && msgData.communicatStatus == "SUCCESS") {
            console.log(msgData)
            $('.checkFusing').children[1].innerText='熔断器已连接';
            $('.chooseFusingPoint').style.display='block';
            FuseFreq = msgData.detect.freqInt;
            fusingPoint.children[0].value = '工作频点2:'+FuseFreq;
          } else if (dataUUID.fuseFreq.UUID == msgData.serviceUUID && msgData.communicatStatus != "SUCCESS") {
            $('.checkFusing').children[1].innerText='熔断器未连接请插入熔断器！';
          }
          // 探空仪检测
          if (dataUUID.sondeFreq.UUID == msgData.serviceUUID && msgData.communicatStatus == "SUCCESS") {
            console.log(msgData)
            $('.checkSonde').children[1].innerText='探空仪已连接';
            $('.chooseSondePoint').style.display='block';
            SondeFreq = msgData.detect.freqInt;
            sondePoint.children[0].value = '工作频点1:'+SondeFreq;
          } else if (dataUUID.sondeFreq.UUID == msgData.serviceUUID && msgData.communicatStatus != "SUCCESS") {
            $('.checkSonde').children[1].innerText='探空仪未连接请插入探空仪！';
          }
          // console.log(msgData)

          // 设置检查
          if (dataUUID.setFuseFreq.UUID == msgData.serviceUUID && msgData.communicatStatus == "SUCCESS") {
            console.log(msgData)
          } else if (dataUUID.setFuseFreq.UUID == msgData.serviceUUID && msgData.communicatStatus != "SUCCESS") {
            alert('设置失败')
          }
          if (dataUUID.setSondeFreq.UUID == msgData.serviceUUID && msgData.communicatStatus == "SUCCESS") {
            console.log(msgData)
          } else if (dataUUID.setSondeFreq.UUID == msgData.serviceUUID && msgData.communicatStatus != "SUCCESS") {
            alert('设置失败')
          }
        },0)
      });
      order.registerHandler('addr_dd_spectrum', function (err, msg) {
        // console.log(JSON.parse(msg.body))
        var data = JSON.parse(msg.body)
        // console.log(data)
        let info = data.data;
        let arr=[];
        let unit = data.type==0?6:data.type;
        let startSpectrom=0,endSpectrom=0;
        let centerPoint=data.centerFreq/1000;
        // if (unit!=0 && unit!=6) {
        //   if (centerPoint-500*unit<=400*1000) {
        //     startSpectrom = 400*1000;
        //     info = info.splice(parseInt((centerPoint-400*1000)/unit))
        //   } else {
        //     startSpectrom = centerPoint-500*unit;
        //   }
        //   if (centerPoint+499*unit>=406*1000) {
        //     endSpectrom = 406*1000;
        //     info = info.splice(parseInt((406*1000-centerPoint)/unit))
        //   } else{
        //     endSpectrom = centerPoint+499*unit;
        //   }
        //   for (let i=1;i<=info.length;i++) {
        //     arr.push((startSpectrom/1000+i*unit).toFixed(2))
        //   }
        // } else {
        //   for (let i = 1; i <= info.length; i++) {
        //     arr.push((400 + i * (6 / 1000)).toFixed(2))
        //   }
        // }
        for (let i = 1; i <= 120; i++) {
          arr.push((400 + i * (50 / 1000)).toFixed(2))
        }
        spectrometerOption.series[0].data=info;
        spectrometerOption.xAxis.data=arr;
        spectrumArr=arr;
        spectrometerChart.setOption(spectrometerOption)
      });
      order.registerHandler('addr_dd_sonde', function (err, msg) {
        // console.log(JSON.parse(msg.body))
        if (msg.body && JSON.parse(msg.body).deviceSN == idItem.YSRP.sn) {
          sondeData=JSON.parse(msg.body);
        }
      })
      order.registerHandler('addr_dd_basetest', function (err, msg) {
        if (msg.body && JSON.parse(msg.body).deviceSN == idItem.YBMB.sn) {
          baseData=JSON.parse(msg.body);
          // console.log(baseData)
        }
      });
    };

    setInterval(function () {
      if (sondeData && baseData &&  baseState.stateNum === 1) {
        let newTime = new Date()
        sondeArr.time.push(parseInt(sondeData.seconds) || parseInt(newTime.getTime()/1000))
        sondeArr.temperature.push(sondeData.temperature || NaN)
        sondeArr.humidity.push(sondeData.humidity || NaN)
        sondeArr.pressure.push(sondeData.pressure || NaN)

        baseArr.time.push(parseInt(baseData.receiveTime/1000) || parseInt(newTime.getTime()/1000))
        baseArr.temperature.push(baseData.baseTestTemperature || NaN)
        baseArr.humidity.push(baseData.baseTestHumidity || NaN)
        baseArr.pressure.push(baseData.baseTestPressure || NaN)

        baseChartOption.xAxis[0].data=baseArr.time;
        baseChartOption.xAxis[1].data=sondeArr.time;
        baseChartOption.xAxis[2].data=baseArr.time;
        baseChartOption.xAxis[3].data=sondeArr.time;
        baseChartOption.xAxis[4].data=baseArr.time;
        baseChartOption.xAxis[5].data=sondeArr.time;

        baseChartOption.series[0].data=baseArr.temperature;
        baseChartOption.series[1].data=sondeArr.temperature;

        baseChartOption.series[2].data=baseArr.humidity;
        baseChartOption.series[3].data=sondeArr.humidity;

        baseChartOption.series[4].data=baseArr.pressure;
        baseChartOption.series[5].data=sondeArr.pressure;

        baseChart.setOption(baseChartOption)
      }

    },1000)

    function setData() {
      console.log(step.getSchedule())
      if (step.getSchedule() == 0 && idItem.YSRP && idItem.YBMB) {
        ajax({
          url: baseUrl + '/getqz?id='+idItem.YSRP.ids+'&type=YSRP'+'&UUID='+dataUUID.qz.UUID + '&Sn=' + idItem.YSRP.sn,
        }).then(res => {
          console.log(res)
        })
        ajax({
          url: baseUrl + '/getfixedLength?id='+idItem.YSRP.ids+'&UUID='+dataUUID.fixedLength.UUID+ '&Sn=' + idItem.YSRP.sn,
        }).then(res => {
          console.log(res)
        })
        // ajax({
        //   url: baseUrl + '/getswichAfc?id='+idItem.YSRP.ids+'&UUID='+dataUUID.swichAfc.UUID+ '&Sn=' + idItem.YSRP.sn,
        // }).then(res => {
        //   console.log(res)
        // })
        ajax({
          url: baseUrl + '/getfreq?id='+idItem.YSRP.ids+'&channalnumber=1'+'&UUID='+dataUUID.freq.UUID+ '&Sn=' + idItem.YSRP.sn,
        }).then(res => {
          console.log(res)
        })
      }
      // if (step.getSchedule() == 1 && idItem.YSRP && idItem.YBMB) {
        // ajax({
        //   url: baseUrl + '/getswichScan?id=' + idItem.YSRP.ids+'&UUID='+dataUUID.swichScan.UUID+ '&Sn=' + idItem.YSRP.sn
        // }).then(res => {
        //   console.log(res)
        //   // msgItem.SWITCHSCAN = res.UUID
        // })
        // ajax({
        //   url: baseUrl + '/getbandWidth?id=' + idItem.YSRP.ids+'&UUID='+dataUUID.bandWidth.UUID+ '&Sn=' + idItem.YSRP.sn
        // }).then(res => {
        //   console.log(res)
        //   // msgItem.BANDWIDTH = res.UUID
        // })
      // }
  //     if (step.getSchedule() == 2 && idItem.YSRP && idItem.YBMB) {
  //
  //     }
      if (step.getSchedule() == 3 && idItem.YSRP && idItem.YBMB) {
        ajax({
          url: baseUrl + '/getsondeNum?id=' + idItem.YBMB.ids+'&UUID='+dataUUID.sondeNum.UUID+ '&Sn=' + idItem.YBMB.sn
        }).then(res => {
          console.log(res)
        })
      }
    }
  }
})()
