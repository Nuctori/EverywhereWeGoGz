$(function(){
  "use strict";
//添加产品默认图;
  addDefaultImg($(".travelPage-version2"));
  tabAnimate(".section-nav-tab ul li",".section-right",'.section-nav-cont','active');

//  // 日期选择器
//  $(".fixaction-date").gzldatepicker({
//    pick_type: "range",
//    clickFn: function (res) {
//      $(".fixaction-date input").eq(0).val(res);
//    }
//  });

  // swiper 旧版本 2.7版本兼容ie8 ietester实测
     // 头部  
  var bannerLength = $(".swiper-container").children(".swiper-wrapper").children().length;
  if (bannerLength > 1) {
    // 头部  
    var mySwiper = new Swiper('.swiper-container',{
      loop: true,
      autoplay: 8000,
      speed: 1000,
      pagination: '.pagination-swiper',
      paginationClickable: true,
      autoplayDisableOnInteraction: false, // 手动滑动保持自动播放
    });
    // 鼠标移入banner停止自动播放
    $(".swiper-wrap").on("mouseenter",function() {
      mySwiper.stopAutoplay();
    });
    // 鼠标移出banner开始自动播放
    $(".swiper-wrap").on("mouseleave",function() {
      mySwiper.startAutoplay();
    })
    // 鼠标经过切换轮播图
    $(".pagination-swiper span").hover(function() {
      var index = $(this).index();
      mySwiper.swipeTo(index,1000,false);
    })
    fixdomleft(".pagination-swiper");
  }
  // 动态修正分页器位置
  function fixdomleft(dom){
    var Domwidth = $(dom).width()/2;
    $(dom).css({
      "margin-left": -Domwidth
    })   
  }
  fixdomleft(".pagination-swiper");
});

function searchGrouptour(){
	var keyword=$("#keyword").val();
	var departureDays = $("#departureDays").val();
	if(keyword==null || keyword=="" || keyword==undefined){
		 $("#keyword").addClass("warning");
		return;
	}
	var href=ctx+"/search/all_list.html?destName="+keyword+"&searchtype=PRODUCTGROUP&searchfield="+keyword
	if(departureDays!=null&&departureDays!=""&&departureDays!=undefined){
		href = href +"&departureDays="+departureDays
	}
	//window.location.href=href;
	window.open(href);
}