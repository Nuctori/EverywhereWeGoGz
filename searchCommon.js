var oldSearchkeyWord='';//前一次的搜索使用的关键字
var searchFinished=true;//判断是否搜索完成，用来防止重复请求
$(document).ready(function(){
	var frameEdit = $.query.get("frameEdit");
	if(frameEdit == 'Y'){
		$(".recommendList").show();
	}
    //$("#searchfield").blur(function(){
  	  //initSearchPageNav();
    //});
    //$("#search").click(function(){
    	  //initSearchPageNav();
    //});
	  /*var historySwiper = new Swiper('.browsing-history .swiper-container',{
		  });
		  $('.browsing-history .arrow-left').click(function(){
		    historySwiper.swipePrev();
		  })
		  $('.browsing-history .arrow-right').click(function(){
		    historySwiper.swipeNext();
		  })*/
});

function showOrHideTypeNav(options){
	return;//需求变，暂时不使用
	if(!options.hasWf && !options.hasQz && !options.hasPq && !options.hasJd && !options.hasYl && !options.hasDdwl && !options.hasZyx && !options.hasGty){
		$(".searchPage-header-nav-wrap").hide();
		$(".filter-Condition-wrap").hide();
		$(".sort-nav").hide();
	}else {
		$(".searchPage-header-nav-wrap").show();
		$(".filter-Condition-wrap").show();
		$(".sort-nav").show();
	}
	if(!options.hasWf){
		$(".searchPage-nav").find(".nav9").hide();
	}else {
		$(".searchPage-nav").find(".nav9").show();
	}
	if(!options.hasYl){
		$(".searchPage-nav").find(".nav8").hide();
	}else {
		$(".searchPage-nav").find(".nav8").show();
	}
	if(!options.hasQz){
		$(".searchPage-nav").find(".nav7").hide();
	}else {
		$(".searchPage-nav").find(".nav7").show();
	}
	if(!options.hasPq){
		$(".searchPage-nav").find(".nav6").hide();
	}else {
		$(".searchPage-nav").find(".nav6").show();
	}
	if(!options.hasJd){
		$(".searchPage-nav").find(".nav5").hide();
	}else {
		$(".searchPage-nav").find(".nav5").show();
	}
	if(!options.hasDdwl){
		$(".searchPage-nav").find(".nav4").hide();
	}else {
		$(".searchPage-nav").find(".nav4").show();
	}
	if(!options.hasZyx){
		$(".searchPage-nav").find(".nav3").hide();
	}else {
		$(".searchPage-nav").find(".nav3").show();
	}
	if(!options.hasGty){
		$(".searchPage-nav").find(".nav2").hide();
	}else {
		$(".searchPage-nav").find(".nav2").show();
	}
}

function getRecommendList(num){
	var keyword = $("#searchfield").val();
	$.ajax({
        url:pageParam.ctx+"/search/getKeywordRecommendList.json",
        data:{keyword:keyword, num:num},
        type:"POST",
        success:function(data){
        	if(data.result=="success"){
        		$("#relatedRecommend").empty();
        		var recommendList = data.recommendList;
        		if(recommendList==null||recommendList.length<=0){
					$(".related-recommend").hide();
					return;
				}else {
					$(".related-recommend").show();
				}
        		var html='<a href="@url" target="_blank"><li><div class="surf-item">'+
                    '<div class="img-wrap"><img src="@picUrl" alt=""></div>'+
                    '<div class="surf-prod-title">@title</div>'+
                    '<div class="surf-prod-price"><span>￥</span>@b2cMinPrice</div>'+
        			'</div></li></a>';
        		var recommends = "";
        		for(var index=0; index<recommendList.length; ++index){
					var recommendPd = recommendList[index];
					recommends+=html;
					console.log(recommendPd.images);
					recommends = recommends.replace("@picUrl",recommendPd.images[0].imageStr);
					recommends = recommends.replace("@title",recommendPd.title);
					recommends = recommends.replace("@b2cMinPrice",recommendPd.b2cMinPrice);
					recommends = recommends.replace("@url",recommendPd.url);
        		}
        		$("#relatedRecommend").append(recommends);
        	}
        }
	});
}

function getFootMarkList(){
	var type=$("#search_option").val();
	if(type=="FREETRAVEL"){
		type = "freetour";
	}else{
		type = "grouptour";
	}
	var outerFirst = '<div class="swiper-slide">';
	var outer = '<div class="swiper-slide">';
    $.ajax({
        url:pageParam.ctx+"/footMark/getFootMarkList.json",
        data:{type:type},
        type:"POST",
        success:function(data){
        	if(data.result=="success"){
        		$("#footMarkList").empty();
        	   var footMarkList=data.data;
        	   
               var html =""
              var itemLi = '<div class="browsing-prod">'+
              	'<a href="@pdUrl" target="_blank">'+
                  '<div class="browsing-prod-img"><img src="@pdPhotoUrl"></div>'+
                  '<div class="browsing-prod-info">'+
                    '<h2>@pdName</h2>'+
                    '<div class="price-item">@price</div>'+
                  '</div></a>'+
                '</div>';
               var itemLi1= '<a target="_blank" href="@pdUrl">\r\n'+
               '<li>\r\n'+
                 '<div class="surf-item">\r\n'+
                   '<div class="img-wrap"><img src="@pdPhotoUrl" alt=""></div>\r\n'+
                   '<div class="surf-prod-title">@pdName</div>\r\n'+
                   '<div class="surf-prod-price"><span>￥</span>@price</div>\r\n'+
                 '</div>\r\n'+
                '</li>\r\n'+
              '</a>\r\n';
				if(footMarkList==null||footMarkList.length<=0){
					$(".browsing-history").hide();
					return;
				}else {
					//$(".footMark").show();
					$(".browsing-history").show();
				}
				var size = -1;
				if(footMarkList.length > 4){
					size = footMarkList.length/4 +1;
				}
				var count = 0;
                for(var index=0;index<footMarkList.length;++index){
					var footMark = footMarkList[index];
					var itemHtml = "";
					if(index == 0){
						itemHtml = outerFirst;
					}
					if(index != 0 && count == 0){
						itemHtml = itemHtml + outer;
					}
					itemHtml = itemHtml + itemLi;
					itemHtml = itemHtml.replace("@pdUrl",footMark.pdUrl);
					itemHtml = itemHtml.replace("@pdPhotoUrl",footMark.pdPhotoUrl);
					itemHtml = itemHtml.replace("@pdName",footMark.pdName);
					if(isNotNull(footMark.price) && footMark.price!="null"){
						itemHtml = itemHtml.replace("@price","¥<strong>"+footMark.price+"</strong>");
					}else{
						itemHtml = itemHtml.replace("@price","");
					}
					
					html =html + itemHtml;
					count++;
					if(count == 4 || index == footMarkList.length-1){
						html = html + '</div>';
						count = 0;
					}
				}
                $("#footMarkList").append(html);
                if(footMarkList.length <= 4){
                	$(".arrow-left").hide();
                	$(".arrow-right").hide();
                }else{
                	var historySwiper = new Swiper('.browsing-history .swiper-container',{
                      });
                      $('.browsing-history .arrow-left').click(function(){
                        historySwiper.swipePrev();
                      })
                      $('.browsing-history .arrow-right').click(function(){
                        historySwiper.swipeNext();
                      })
                }
                
                if(footMarkList.length > 0){
                	//$(".footMark").show();
                	$(".browsing-history").show();
            	}
            	
            }
        }
    });
}

//获取酒店星级
function getHotelStar(){
	$(".prod-stars").each(function(){
		var resLevel = '';
		resLevel = $(this).attr("reslevel");
		var obj = $(this);
		var options = {resLevel:resLevel};
	    var url = pageParam.ctx+"/search/getHotelStar.json";
		$.ajax({
			  url: url,
			  type: 'post',
			  dataType: 'json',
			  data: options,
			  complete:function(){
			  },
			  success: function (data) {
				  if(data.success) {
					 //console.log("resLevel="+data.responseObject);
					 var hotelStartLevel="";
					 if(data.responseObject == '经济'){
						 hotelStartLevel = '<i class="prod-diamon"></i><i class="prod-diamon"></i>';
					 }
					 if(data.responseObject == '高级'){
						 hotelStartLevel = '<i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i>';
					 }
					 if(data.responseObject == '豪华'){
						 hotelStartLevel = '<i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i>';
					 }
					 if(data.responseObject == '超豪华'){
						 hotelStartLevel = '<i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i><i class="prod-diamon"></i>';
					 }
					 if(data.responseObject == '三星'){
						 hotelStartLevel = '<i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i>';
					 }
					 
					 if(data.responseObject == '四星'){
						 hotelStartLevel = '<i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i>';
					 }
					 if(data.responseObject == '五星'){
						 hotelStartLevel = '<i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i><i class="normal-star"></i>';
					 }
					 if(data.responseObject == '白金五星'){
						 hotelStartLevel = '<i class="goldWhite-star"></i><i class="goldWhite-star"></i><i class="goldWhite-star"></i><i class="goldWhite-star"></i><i class="goldWhite-star"></i>';
					 }
					 if(isNotNull(hotelStartLevel)){
						 var emCls = '';
						 if(data.responseObject == '白金五星'){
							 emCls = 'goldWhite';
						 }
						 hotelStartLevel = '<span class="diamon-group">'+hotelStartLevel+'<em class="'+emCls+'">'+data.responseObject+'</em></span>';
						 $(obj).html(hotelStartLevel);
						 $(obj).show();
					 }
				  }
			  },error: function() {
			  }
		});
	})
}

//获取关键字推荐产品
var oldKeyWord='';
var oldSearchType='';
function getKeyWordRecommendList(keyWord,searchType){
	if(oldKeyWord == keyWord && oldSearchType == searchType){
		return;
	}else {
		$(".hotSale-recommend").remove();
		oldKeyWord=keyWord
		oldSearchType=searchType
	}
    $.ajax({
        url:pageParam.ctx+"/search/getKeyWordRecommendList.json",
        data:{searchType:searchType,keywordName:keyWord},
        type:"POST",
        success:function(data){
        	if(data.success){
        		//console.log(data);
        		var html='';
        		var itemLi =
        		'<a href="@pdUrl"\r\n'+
				 'onclick="javascript:ga(\'send\',\'event\',\'默认搜索列表页产品点击次数统计\',\'默认产品名称点击\',\'@pdTitle\'));ga(\'gz.send\',\'event\',\'默认搜索列表页产品点击次数统计\',\'默认产品名称点击\',\'@pdTitle\'));return isOnSaleLink(\'@pdId\',\'@pdType\')"\r\n'+
				 'target="_blank" title="@xTitle">\r\n'+
				 	'<span class="keywordId piwikPdId" pdId="@pdId" style="display:none;"></span>\r\n'+
	                '<div class="hotSale-prod">\r\n'+
	                  '<div class="hotsale-prod-img-wrap">\r\n'+
	                  	'<img src="@pdImgUrl" width="210" height="150" alt="@returnDestName-@title" onerror="this.onerror=\'\';this.src=\'@pdImgErrorUrl\'" />\r\n'+
	                  '</div>\r\n'+
	                  '<div class="hotsale-prod-msg">\r\n'+
	                    '<div class="hotsale-prod-tit">@title</div>\r\n'+
	                    '<div class="hotsale-price"> <span>￥</span>@b2cMinPrice</div>\r\n'+
	                  '</div>\r\n'+
	                '</div>\r\n'+
	             '</a>\r\n';
        		var indexNum = 4;
        		if(data.responseObject.length < 4){
        			indexNum = data.responseObject.length;
        		}
        		for(var i=0 ; i<indexNum; i++){
        			var groupTour = data.responseObject[i];
        			var pdUrl = getPdUrl(groupTour);
        			var title = groupTour.title;
        			var pdTitle = groupTour.title.replace(/<[^>].*?>/g,'');
        			var pdId = groupTour.pdId;
        			var pdType = groupTour.type;
        			var xTitle = groupTour.title.replace(/<em>|<\/em>/g,'');
        			var pdImgUrl = getImgUrl(groupTour);
        			var pdImgErrorUrl = "";
        			if(isNotNull(groupTour.defaultImage) && isNotNull(groupTour.defaultImage.imageStr)){
        				pdImgErrorUrl = groupTour.defaultImage.imageStr;
        			}
        			var b2cMinPrice = groupTour.b2cMinPrice;
        			keyListPdIds.push(pdId);
        			var itemHtml = ""+itemLi;
					itemHtml = itemHtml.replace(/@pdUrl/g,pdUrl);
					itemHtml = itemHtml.replace(/@title/g,title);
					itemHtml = itemHtml.replace(/@pdTitle/g,pdTitle);
					itemHtml = itemHtml.replace(/@pdId/g,pdId);
					itemHtml = itemHtml.replace(/@pdType/g,pdType);
					itemHtml = itemHtml.replace(/@returnDestName/g,returnDestName);
					itemHtml = itemHtml.replace(/@xTitle/g,xTitle);
					itemHtml = itemHtml.replace(/@pdImgUrl/g,pdImgUrl);
					itemHtml = itemHtml.replace(/@pdImgErrorUrl/g,pdImgErrorUrl);
					itemHtml = itemHtml.replace(/@b2cMinPrice/g,b2cMinPrice);
					if(i%2==0){
						itemHtml = 
							'<div class="swiper-slide">\r\n'+
	      					'<div class="hotSale-item">\r\n'+
	      					itemHtml;
					}
					
					if((i+1)%2==0 || i==(data.responseObject.length-1)){
						itemHtml = 
							itemHtml +
							'\r\n</div>\r\n'+
	      					'</div>\r\n';
					}
					html =html+itemHtml;
        		}
        		//console.log("keyListPdIds: "+keyListPdIds);
        		var piwikPdIds = "";
			    if(keyListPdIds.length>0){
			    	piwikPdIds = keyListPdIds.join(",");
			    }
			    //piwik埋点
			    if(piwikPdIds!=""){
			        doPiwikEvent("产品曝光","产品搜索页",piwikPdIds,null);
			    }
        		if(isNotNull(html)){
        			html = 
        				'<div class="hotSale-recommend">\r\n'+
        					'<div class="hotSale-imgWrap"><img src="'+pageParam.ctx+'/staticpc/images/recommendHotSale.png" alt=""/></div>\r\n'+
        					'<div class="hotSale-swiperWrap">\r\n'+
		        	          '<div class="swiper-container">\r\n'+
		        	            '<div class="swiper-wrapper">\r\n'+
		        	            	html+
		        	            '</div>\r\n'+
		        	          '</div>\r\n'+
		        	          '<div class="hotSale-arrow arrow-left"><i class="seachPage-hotSale-arrow-l"></i></div>\r\n'+
		        	          '<div class="hotSale-arrow arrow-right"><i class="seachPage-hotSale-arrow-r"></i></div>\r\n'+
		        	        '</div>\r\n'+
		        	    '</div>\r\n';
        			
        			$(".bgfff").after(html);
        			// 热门推荐swiper
        			// swiper 工厂模式
        			var mySwiper = new Swiper('.swiper-container',{
        				loop: true,
        			});
        			$('.arrow-left').click(function(){
        				  mySwiper.swipePrev(); 
        			})
        			$('.arrow-right').click(function(){
        				mySwiper.swipeNext(); 
        			})
        		}
            }
        }
    });
}

function initSearchPageNav(){
	$(".searchPage-nav").find("a").each(function(){
		var pdType = $(this).attr("stype");
		var destName = $("#searchfield").val();
		var destNameStr = ""
		var fullUrl = location.href;
		var fullUrlSplit = fullUrl.split("&");
		var cityName = "";
		for(var i = 0; i<fullUrlSplit.length; i++){
			var s = fullUrlSplit[i];
			if(s.indexOf("cityName") != -1){
				var splt = s.split("=");
				if(splt.length >= 2){
					cityName = splt[1];
				}
			}
		}
		if(isNotNull(destName)){
			destNameStr = "destName="+destName;
		}else {
			if(isNotNull(cityName)){
				destNameStr = "destName="+cityName;
			}else{
				destNameStr = "";
			}
		}
		var searchfield = destName;
		if(!isNotNull(destName)){
			if(isNotNull(cityName)){
				searchfield = cityName;
			}
		}
		var searchfieldStr = ""
		if(isNotNull(searchfield)){
			searchfieldStr = "&searchfield="+searchfield;
		}else {
			searchfieldStr = "";
			if(isNotNull($(this).attr("href"))){
				//如果为空则不重新设置
				if($(this).attr("href").indexOf("http") >= 0){
					return;
				}
			}
		}
		var startDate = getDate(0);
		var endDate = getDate(1);
		var url = pageParam.wwwSiteUrl;
		if(!isNotNull(destName)){
			if(isNotNull(cityName)){
				destName = cityName;
			}
		}
		if(pdType == 'ALL'){
			url += "/search/all_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'YJYT'){
			url += "/search/yjyt_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'PRODUCTGROUP'){
			url += "/search/grouptravel_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'FREETRAVEL'){
			url += "/search/freetravel_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'LOCAL'){
			url += "/search/grouptravel_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'HOTEL'){
			url += "/hotel/domesticHotelList.html?startDate="+startDate+"&endDate="+endDate+"&keywords="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'TICKET'){
			url += "/tickets/list.html?keyword="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'SOLID'){
			url += "/soldGoods/list.html?keyword="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'VISA'){
			url += "/visa/list.html?keyWord="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'CRUISE'){
			url += "/search/cruise_list.html?title="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'WIFI'){
			url += "/wifi/list.html?keyWord="+destName+"&searchtype="+pdType+searchfieldStr;
		}else if(pdType == 'BUS'){
			url += "/bus/list.html?keyWord="+destName+"&searchtype="+pdType+searchfieldStr;
		}else {
			url += "/search/all_list.html?"+destNameStr+"&searchtype="+pdType+searchfieldStr;
		}
		$(this).attr("href",pageParam.ctx+url);
	});
}

function clearSelectedConditions(){
	var searchtype =  $.query.get("searchtype");
	if(searchtype == "HOTEL"){
		
	}
	$(".sort-nav-list").find(".sort-item").each(function(){
		if(!$(this).hasClass("sort-price-range-wrap")){
			$(this).removeClass("active");
		}
		$(this).find("i").each(function(){
			if($(this).hasClass('seachPage-filter-range-up')){
				$(this).removeClass("seachPage-filter-range-up");
				$(this).addClass("seachPage-filter-range-down");
			}
			$(this).removeClass("active");
			$(this).removeClass("up");
			$(this).removeClass("down");
		})
	})
	$(".sort-nav-list").find(".sort-item:lt(1)").addClass("active");
	
	$(".minPrice").val("");
	$(".maxPrice").val("");
	
	$(".yourChoice-wrap").remove();
	$(".filterCondition-item").show();
	
}

function setSelectedType(searchtype){
	//console.log("isSolid: "+searchtype);
	if(searchtype == "ALL"){
		$(".searchPage-nav-item.nav1").addClass("active");
	}else if(searchtype == "YJYT"){
		$(".searchPage-nav-item.nav11").addClass("active");
	}else if(searchtype == "PRODUCTGROUP"){
		$(".searchPage-nav-item.nav2").addClass("active");
	}else if(searchtype == "FREETRAVEL"){
		$(".searchPage-nav-item.nav3").addClass("active");
	}else if(searchtype == "LOCAL"){
		$(".searchPage-nav-item.nav4").addClass("active");
	}else if(searchtype == "HOTEL"){
		$(".searchPage-nav-item.nav5").addClass("active");
	}else if(searchtype == "TICKET"){
		$(".searchPage-nav-item.nav6").addClass("active");
	}else if(searchtype == "VISA"){
		$(".searchPage-nav-item.nav7").addClass("active");
	}else if(searchtype == "CRUISE"){
		$(".searchPage-nav-item.nav8").addClass("active");
	}else if(searchtype == "WIFI"){
		$(".searchPage-nav-item.nav9").addClass("active");
	}/*else if(searchtype == "BUS"){
		$(".searchPage-nav-item.nav10").addClass("active");
	}*/else if(searchtype == "SOLID"){
		//console.log("aaa")
		$(".searchPage-nav-item.nav10").addClass("active");
		var val = $("#SOLID").parents(".select-group").find(".select-val");
    	$("#SOLID").addClass("active").siblings().removeClass("active");
    	$("#search_option").val("SOLID");
    	val.text($("#SOLID").text());
    	
	}else {
		$(".searchPage-nav-item.nav1").addClass("active");
	}
}

//过滤更多箭头
function fixSeachPageDrowdown(){
	$(".filterCondition-item").find(".moreChoice").find(".seachPage-drow").each(function(index,el){
		if($(el).parent().parent().parent().is(':visible')){
			var totalWidth = 0; // 判定长度
			var fold = false
			$(el).parents(".filterCondition-item").find(".filter-item-left>li").each(function(liindex,lili){
				//console.log(typeof(totalWidth));
				totalWidth += $(lili).width() + 6
				if(totalWidth>976){
					fold = false;
				}else {
					fold = true;
				}
			})
			if(fold){
				$(el).remove()
			}
		}
	})
}

//是否显示，没有搜索结果提示
function showBlank(flag){
	var searchType = $.query.get("searchtype");
	if(flag){
		$(".sorryNothingSearch").show();
		//if(searchType=='ALL' || searchType=='PRODUCTGROUP' || searchType=='FREETRAVEL' || searchType=='LOCAL'){
			$(".AllsorryNothingSearch").show();
			if($(".search-none-box").find("li").length>0){
				$(".search-none-box").show();
			}else {
				$(".search-none-box").hide();
			}
			$(".footMark").hide();
			$(".recommendList").hide();
			$(".bgfff").hide();
			$(".searchPage-header-nav-wrap").hide();
			$(".allHotelMap").hide();
			
		//}
	}else {
		$(".sorryNothingSearch").hide();
		//if(searchType=='ALL' || searchType=='PRODUCTGROUP' || searchType=='FREETRAVEL' || searchType=='LOCAL'){
			$(".AllsorryNothingSearch").hide();
			$(".search-none-box").hide();
			
			if($(".footMark").find("li").length>0){
				$(".footMark").show();
			}else {
				$(".footMark").hide();
			}
			if($(".recommendList").find("li").length>0){
				$(".recommendList").show();
			}else {
				$(".recommendList").hide();
			}
			$(".bgfff").show();
			$(".searchPage-header-nav-wrap").show();
			$(".allHotelMap").show();
		//}
	}
	if(getQueryString('frameEdit') == 'Y'){//装修时要显示出来
		$(".recommendList").show();
	}
}

function getQueryString(name)
{
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return unescape(r[2]); return null;
}


//获取排序方式
function getOrder(){
	var type=$("#search_option").val();
	var order = '';
	var orderTypeEle = $(".sort-nav-list").find(".active");
	var orderType = orderTypeEle.attr("orderType");
	if(orderType == '0'){
		order = '';
	}else if(orderType == '1'){
		if(orderTypeEle.find(".seachPage-filter-range-down").length > 0){
			order = 'salesVolume,desc';
		}else {
			order = 'salesVolume,asc';
		}
	}else if(orderType == '2'){
		if(orderTypeEle.find(".seachPage-filter-range-down").length > 0){
			order = 'commentScore,desc';
		}else {
			order = 'commentScore,asc';
		}
	}else if(orderType == '3'){
		if(orderTypeEle.find(".down").length > 0){
			if(type == 'HOTEL') {
				order = 'minPrice,desc';
			}else {
				order = 'b2cMinPrice,desc';
			}
		}else {
			if(type == 'HOTEL') {
				order = 'minPrice,asc';
			}else {
				order = 'b2cMinPrice,asc';
			}
		}
	}else if(orderType == '4'){
		if(orderTypeEle.find(".seachPage-filter-range-down").length > 0){
			order = 'travelDays,desc';
		}else {
			order = 'travelDays,asc';
		}
	}
	return order;
}
//获奖价格范围
function getPriceRange(){
	var priceRange = '';
	var minPrice = $(".minPrice").val();
	var maxPrice = $(".maxPrice").val();
	if(isNotNull(minPrice) && isNotNull(maxPrice) && Number(maxPrice)<Number(minPrice)){
		minPrice = maxPrice;
		maxPrice = $(".minPrice").val();
		$(".minPrice").val(minPrice);
		$(".maxPrice").val(maxPrice);
	}
	if(!isNotNull(minPrice) && isNotNull(maxPrice)){
		minPrice = "0";
	}
	if( minPrice!=""&& maxPrice==""){
		priceRange=minPrice+"-";
	}else if(maxPrice!="" && minPrice==""){
		priceRange="-"+maxPrice;
	}else if(maxPrice!="" && minPrice!=""){
		priceRange=minPrice+"-"+maxPrice;
		$(".minPrice").val(minPrice);
		$(".maxPrice").val(maxPrice);
	}
	return priceRange;
}

//替换某个参数的值
function replaceValue(name,_name,_value,value){
	if(_name=="pdTag"){
		if(name==_name){
			if(_value!=''&&value!=null&&_value.indexOf(value)==-1){			
					_value = _value+","+value;			
			}else{
				if(value==null){
					if(_value.lastIndexOf(",")!=-1){
						_value = _value.substring(0,_value.lastIndexOf(","));
					}else{
						_value = value;
					}
				}else{
					_value = value;				
				}				 
			}
		}
	}else if(_name=="newDestName"){
		if(name==_name){
			if(_value!=''&&value!=null&&_value.indexOf(value)==-1){			
					_value = _value+","+value;			
			}else{
				if(value==null){
					if(_value.lastIndexOf(",")!=-1){
						_value = _value.substring(0,_value.lastIndexOf(","));
					}else{
						_value = value;
					}
				}else{
					_value = value;				
				}				 
			}
		}
	}else{
	    if(name==_name){
	        _value = value;
	    }
	}
    return _value==null?"":_value;
}

function clearContent(){
	$(".S_selectList_suggest").hide();//按回车搜索，应该隐藏下拉
	$(".search_inputBox").hide();//按回车搜索，应该隐藏下拉
	$(".prod-list").html("");
}

function getDate(diff){
	var nowDate = new Date(new Date().getTime() + (diff*24*60*60*1000));	
	var year = nowDate.getFullYear();
    var month = nowDate.getMonth() + 1;
    var day = nowDate.getDate();
    var dataDate = year + "-" + formatday(month) + "-" + formatday(day);
    return dataDate;
}
//格式化日期
function formatday(str) {
  str = str.toString();
  return str[1] ? str : '0' + str;
}
//判断是否为空
function isNotNull(value){
    return value!=undefined&&value!=""&&value!=null;
}

//格式化日期
Date.prototype.format = function(fmt) { 
    var o = { 
       "M+" : this.getMonth()+1,                 //月份 
       "d+" : this.getDate(),                    //日 
       "h+" : this.getHours(),                   //小时 
       "m+" : this.getMinutes(),                 //分 
       "s+" : this.getSeconds(),                 //秒 
       "q+" : Math.floor((this.getMonth()+3)/3), //季度 
       "S"  : this.getMilliseconds()             //毫秒 
   }; 
   if(/(y+)/.test(fmt)) {
           fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
   }
    for(var k in o) {
       if(new RegExp("("+ k +")").test(fmt)){
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
   return fmt; 
}
