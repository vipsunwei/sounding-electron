function Step(el, option){
  var el = document.querySelector(el);
  var opt = option || {}

  this.el = el;
  this.schedule = 1;
  this.successColor = opt.successColor || "#01C73E"
  this.defultColor = opt.defultColor || "#ccc"
  this.children = {
    title: opt.title || [],
    length: opt.length || 0
  }
  this.returnValue = 0;
  this.title = opt.title || null;
  this.scheduleUnit=['一', '二', '三', '四', '五', '六', '七', '八', '九']

  this.children.length=this.children.length===0?this.children.title.length===0?0:this.children.title.length:this.children.length;
  if (this.children.length!==0) {
    this.creatStep()
    this.click()
    this.init()
  } else {
    console.error('未设置参数')
  }
}
Step.prototype = {
  // 初始化
  init: function (){
    this.schedule = 1;
    this.setSchedule(1)
  },
  // 创建
  creatStep: function (){
    var html='';
    for (var i = 0; i < this.children.length; i++) {
      if (i!==0) {
        html+='<div class="linkLine"><div></div><div class="scheduleLine" style="background:'+this.successColor+'"></div></div>'
      }
      html+=`<div class="stepChild" data-index="${i}">
                <div class="num">${i+1}</div>
                <div class="active">${this.children.title[i]? this.children.title[i]: "步骤"+this.scheduleUnit[i]}</div>
              </div>`
    }
    this.el.innerHTML=html;
    this.stepChild = document.querySelectorAll('.stepChild')
    this.scheduleLine = document.querySelectorAll('.scheduleLine')
  },
  // 设置当前步骤数
  setSchedule: function (val){
    this.schedule = val;
    this.schedule = this.schedule>=this.children.length? this.children.length: this.schedule<=1? 1: this.schedule;
    if (this.schedule>=0) {
      for (var i = 0; i < this.schedule; i++) {
        this.stepChild[i].style.color = this.successColor;
        this.stepChild[i].children[0].style.borderColor = this.successColor;
        // this.scheduleLine[i].style.height = '100%';
      }
    }
    for (var i = val; i < this.children.length; i++) {
      this.stepChild[i].style.color = this.defultColor;
      this.stepChild[i].children[0].style.borderColor = this.defultColor;
      // this.scheduleLine[i].style.height = '0%';
    }
    return this
  },
  // 获取当前步骤数
  getSchedule: function (){
    return this.schedule-1
  },
  // 下一步
  next: function (){
    this.schedule = this.schedule++>= this.children.length? this.children.length: this.schedule++;
    this.stepChild[this.schedule-1].style.color = this.successColor;
    this.stepChild[this.schedule-1].children[0].style.borderColor = this.successColor;
    this.scheduleLine[this.schedule-2].style.height = '100%';
    return this
  },
  // 上一步
  back: function (){
    this.schedule = this.schedule--<= 1? 1: this.schedule--;
    this.stepChild[this.schedule].style.color = this.defultColor;
    this.stepChild[this.schedule].children[0].style.borderColor = this.defultColor;
    this.scheduleLine[this.schedule-1].style.height = '0%';
    return this
  },
  // 点击事件
  click: function (callback){
    var index=0;
    var _this = this;
    this.el.addEventListener('click', function(e){
      if (e.target.className == 'stepChild') {
        index=e.target.dataset.index
      } else if (e.target.parentNode.className == 'stepChild') {
        index=e.target.parentNode.dataset.index
      }
      _this.returnValue = index > _this.schedule? false: index;
      callback && callback()
    })
  },
}
