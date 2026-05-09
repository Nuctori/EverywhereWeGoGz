$(function() {
	/**************************************加载已选择的条件*************************************************start*/
    var destName = $.query.get("destName");
    var returnDestName = $("#returnDestName").val();
    var searchtype =  $.query.get("searchtype");
    
    var deptPlaceName = $.query.get("deptPlaceName");
    var newDestName = $.query.get("newDestName");
    var departureDate = $.query.get("departureDate");
    
    //设置选中哪种类型
    setSelectedType(searchtype);
    
    if(isNotNull(returnDestName)){
    	$("#searchfield").val(returnDestName);
    	$("#destName").val(returnDestName);
    }else{
	    if(!isNotNull(destName)){
	    	$("#destName").val($("#searchfield").val());
	    }else{
	    	$("#destName").val(destName);
	    	$("#searchfield").val(destName);
	    }
    }
    

    //出发地
    if(isNotNull(deptPlaceName)){
    	tpl(yourChoiceItemTpl("出发城市：",deptPlaceName,'deptPlaceName'));
    	$(".startCity").hide();
    }
    
    //目的地
    if(isNotNull(newDestName)){
    	tpl(yourChoiceItemTpl("目的城市：",newDestName,'newDestName'));
    	$(".directionCity").hide();
    }
  
    //出发日期
    if(isNotNull(departureDate)){
    	tpl(yourChoiceItemTpl("出发日期：",departureDate,'departureDays'));
    	$(".tripGoDate").hide();
    }
    
    
    /**************************************加载已选择的条件*************************************************end*/
    initSearchPageNav();
  // group 产品 隐藏第三个以上
  $(".prod-list").find(".group").each(function(index,el){
    if($(el).find("a").length>4){
      $(el).find("a").each(function(indexx,ell){
        if(indexx>3){
          $(ell).hide()
        }
      })
    }else{
      $(el).find(".getAllprod").remove();
    }
  })

    function filterShowLogic(){
        var filterLi = $(".filter-Condition-wrap .filterCondition-list>li")
        // 如果进来超过个筛选条件,绑定更多选项展示条件; 存在更多按钮并,绑定事件;
        if(filterLi.length && filterLi.length>4 && $(".getMoreDetail").length){
          var showNum = 0;
          // 遍历筛选隐藏的
          filterLi.each(function(indexx,ell){
            // 不隐藏的 切 有四条;
            if(!$(ell).is(":hidden")){
              if(showNum<4){
                showNum++
                $(ell).addClass("curIndex");
              }else{
                $(ell).addClass("disable")
              }
            }else{
              // 默认隐藏的话 都是default
              $(ell).addClass("defaultHide")
            }
          })
         
        }else{
          //$(".getMoreDetail").hide();
        }
      }
      filterShowLogic()
  
  // 价格导航条 效果
  $(".sort-nav-list").find(".sort-item").on("click",function(){
	if($(this).hasClass("sort-price-range-wrap")){
		return;
	}
	if($(this).hasClass("sort-tips")){
		return;
	}
	
    $(this).siblings().removeClass("active");
    $(this).siblings().find("i").removeClass("active");
    $(this).siblings().find("i").each(function(){
    	if($(this).hasClass('seachPage-filter-range-up')){
    		$(this).removeClass("seachPage-filter-range-up");
    		$(this).addClass("seachPage-filter-range-down");
    	}
    	$(this).removeClass("up");
    	$(this).removeClass("down");
    })
    var spanText = $(this).find("span").text();
    // 这边 是销售和评分的切换;
    if($(this).hasClass("active") && $(this).find(".seachPage-filter-range-down").length && $(this).find("i").hasClass("active")){
    	if(spanText != '销量' && spanText != '评分'){
    		$(this).find("i").removeClass("seachPage-filter-range-down");
    		$(this).find("i").addClass("seachPage-filter-range-up");
    	}
    	$(this).find("i").addClass("active");
    }else if($(this).hasClass("active") && $(this).find(".seachPage-filter-range-up").length && $(this).find("i").hasClass("active")){
    	$(this).find("i").removeClass("seachPage-filter-range-up");
    	$(this).find("i").addClass("seachPage-filter-range-down");
    	$(this).find("i").addClass("active");
    }else if($(this).find(".seachPage-filter-price").length){
    	// 这个是价格
    	if($(this).find("i").hasClass("up")){
    		$(this).find("i").removeClass("up")
    		$(this).find("i").addClass("down")
    	}else if($(this).find("i").hasClass("down")){
    		$(this).find("i").removeClass("down")
    		$(this).find("i").addClass("up");
    	}else{
    		$(this).find("i").removeClass("down");
    		$(this).find("i").addClass("up");
    	}
    }else{
      $(this).find("i").addClass("active");
    }
    //最后加上active;
    $(this).addClass("active");
    pageIndex = 1;
    getList({needToInitFact:false,useOldSearchKeyWord:true});
  })
  

  // 价格范围隐藏显示
  $(".input-price-range").find("input").focus(function (e) { 
    e.preventDefault();
    $(this).parents(".sort-price-range-wrap").addClass("blur");
    $(this).parents(".sort-price-range-wrap").find(".sort-price-range-down").show();
  });
  
  // autohide2;
  (function ($) {
    $.fn.autoHideWithPriceRange = function (callback) {
      var ele = $(this);
      $(document).on("click", function (e) {
        // 假如点击padding 中也是会被点击取消掉;
        // console.log(e.target === ele.get(0));
        if (ele.is(":visible") && ele.has(e.target).length === 0 && e.target != ele.get(0)) {
          callback(ele);
        }
      });
    };
  })(jQuery);

  $(".sort-price-range-wrap").autoHideWithPriceRange(function(e){
    e.removeClass("blur");
  })

  //价格清空
   $(".cleanall").on("click",function(){
     $(this).parents(".sort-price-range-wrap").find("input").val("");
   })
 
  $(".price-range-surebtn").on("click",function () {
	  var minPrice = $(".minPrice").val();
	  var maxPrice = $(".maxPrice").val();
	  //没有输入价格并请求地址没有价格参数，不发请求
	  if(isNotNull(minPrice) && isNotNull(maxPrice) && Number(maxPrice)<Number(minPrice)){
		  minPrice = maxPrice;
		  maxPrice = $(".minPrice").val();
	  }
	  $(".minPrice").val(minPrice);
	  $(".maxPrice").val(maxPrice);
	  $(".sort-price-range-wrap").removeClass("blur");
	  pageIndex = 1;
	  getList({needToInitFact:true,useOldSearchKeyWord:true,needToClearYourChoice:true});
  })
  
  // 筛选条件日历调用;
  $(".tripDateRange-wrap").gzldatepicker({
    date: {},
    is_double: true,
    is_range: true,
    pick_type: "range",
    clickFn: function (res, obj) {
      //console.log(res);
      $(".tripStartDate").val(res.start);
      $(".tripBackDate").val(res.end);
      $(".priceLimitSure").css("display","inline-block");
    }
  });

  // 出发日期范围标签点击
  $(".tripDateRange-wrap").find("input").on("focus",function(){
    // $(".priceLimitSure").css("display","inline-block");
  })
  $(".tripDateRange-wrap").find("input").on("blur",function(){
    if($(".tripStartDate").val() && $(".tripBackDate").val()){
      $(".priceLimitSure").css("display","inline-block");
    }else{
      $(".priceLimitSure").css("display","none");
    }
  })

  // 出发日期范围选择
  $(".priceLimitSure").on("click",function(){
    var label = "出发日期：";
    var price1Value = $(".tripStartDate").val();
    var price2Value = $(".tripBackDate").val();
    var item;
    // 有第二个值;
    if(price2Value && price1Value){
    	item = price1Value+' 至 ' +price2Value;
    	//tpl(yourChoiceItemTpl(label, item));
    	tpl(yourChoiceItemTpl(label,item,'departureDays'));
  		$(".tripGoDate").hide();
  		$(".tripStartDate").val("");
		$(".tripBackDate").val("");
  		pageIndex = 1;
		getList({useOldSearchKeyWord:true});
    }else{
      return
    }
  })
  
  
  //加载浏览历史
  getFootMarkList();
  getList();
})

function getList(opt){
	clearContent();
	
	var needToInitFact = true;
	var useOldSearchKeyWord = false;
	var needToClearYourChoice = false;
	if(isNotNull(opt)){
		if(opt.needToInitFact != undefined){
			needToInitFact = opt.needToInitFact;
		}
		if(opt.useOldSearchKeyWord != undefined){
			useOldSearchKeyWord = opt.useOldSearchKeyWord;
		}
		if(opt.needToClearYourChoice != undefined){
			needToClearYourChoice = opt.needToClearYourChoice;
		}
	}
	
	if(needToClearYourChoice){
		$(".yourChoice-wrap").remove();
	}
	
	var options = getQueryParams();
	if(needToInitFact){
		$(".filterCondition-list").children("li:gt(1)").remove(); 
		$(".getMoreDetail").hide();
	}
	
	if(useOldSearchKeyWord && isNotNull(oldSearchkeyWord)){
		options['destName'] = oldSearchkeyWord;
	}else {
		$(".Europe").hide();
		$(".Australia").hide();
	}
	$(".pagination").hide();
	//showBlank(false);
	
	$(".syncSearchLoading").show();
    var url = pageParam.ctx+"/search/getAllProductList.json";
    if(!searchFinished){//检测上次搜索是否完成
    	return;
    }

    setTimeout(function(){
    	searchFinished = false;
	    initSearchPageNav();
	    //console.log("useOldSearchKeyWord: "+useOldSearchKeyWord);
		$.ajax({
			  url: url,
			  type: 'post',
			  dataType: 'json',
			  data: {'pdTag': options.pdTag,
				  	 'departureDays':options.departureDays,
				  	 'endDays':options.endDays,
				  	 'deptPlaceId':options.deptPlaceId,
				  	 'deptPlaceName':options.deptPlaceName,
				  	 'travelDaysRange':options.travelDaysRange,
				  	 'destName':options.destName,
				  	 'newDestName':options.newDestName,
				  	 'travelDays':options.travelDays,
				  	 'priceRange':options.priceRange,
				  	 'order':options.order,
				  	 'supplierName':options.supplierName,
				  	 'pdLevel':options.pdLevel,
				  	 'pdIsPlayTour':options.pdIsPlayTour,
				  	 'isGiveWifi':options.isGiveWifi,
				  	 'selfSupport':options.selfSupport,
				  	 'page':options.page,
				  	 'departureMon':options.departureMon,
				  	 'isUseGroup':options.isUseGroup,
				  	 'searchtype':options.searchtype,
				  	 'rd':Math.random()},
			  complete:function(){
				  $(".syncSearchLoading").hide();
				  var searchType = $(".searchPage-nav").find(".active").find("a").attr("stype");
				  var keyWord = $.trim($("#searchfield").val());
				  if(!useOldSearchKeyWord){
					  getKeyWordRecommendList(keyWord,searchType);
					  showEuropbanner('欧洲',options.destName);
					  showVenue(options.destName)
				  }
				  searchFinished = true;
			  },
			  success: function (data) {
				  if(data.success) {
					  //console.log("total: "+JSON.stringify(data.responseObject));
					  //console.log("total: "+JSON.stringify(data.responseObject.totalElements));
					  if(data.desc == "yes"){
						  $.ajax({
							  url: pageParam.ctx+"/search/getRecommondProductList.json",
							  type: 'post',
							  success: function (data) {
								  console.log(data)
								  if((data.groupList!=null &&data.groupList.length>0)||
										  (data.hotelList!=null &&data.hotelList.length>0)||
										  (data.skList!=null &&data.skList.length>0)||
										  (data.scenicList!=null &&data.scenicList.length>0)){
									  $("#botRecommendList").empty();
									  $(".botRecommend-wrap").show();
									  var html = '<a href="@pdUrl" target="_blank">'
								               +'<li class="botRecommend-item">'
									              +'<div class="img-wrap"><img src="@imgStr" width="210" height="140" /></div>'
									              +'<div class="botRecommend-prod-tit">@title</div>'
									              +'<div class="botRecommend-prod-price"><span>￥</span>@price</div>'
									            +'</li>'
								            +'</a>';
									  if(data.groupList!=null &&data.groupList.length>0){
										  var pdHtml = "";
										  for(var i = 0; i< data.groupList.length; i++){
											  var group = data.groupList[i];
											  var title = group.title;
											  var b2cMinPrice = group.b2cMinPrice;
											  var pdUrl = pageParam.ctx+"/grouptour/"+group.pdId+".html";
											  var imageStr = group.defaultImage.imageStr;
											  pdHtml+=html;
											  pdHtml = pdHtml.replaceAll("@title",title);
											  pdHtml = pdHtml.replaceAll("@imgStr",imageStr);
											  pdHtml = pdHtml.replaceAll("@price",b2cMinPrice);
											  pdHtml = pdHtml.replaceAll("@pdUrl",pdUrl);
										  }
										  $("#botRecommendList").append(pdHtml);
									  }
									  if(data.skList!=null &&data.skList.length>0){
										  var pdHtml = "";
										  for(var i = 0; i< data.skList.length; i++){
											  var group = data.skList[i];
											  var title = group.title;
											  var b2cMinPrice = group.b2cMinPrice;
											  var pdUrl = pageParam.ctx+"/freetour/"+group.pdId+".html";
											  var imageStr = group.defaultImage.imageStr;
											  pdHtml+=html;
											  pdHtml = pdHtml.replaceAll("@title",title);
											  pdHtml = pdHtml.replaceAll("@imgStr",imageStr);
											  pdHtml = pdHtml.replaceAll("@price",b2cMinPrice);
											  pdHtml = pdHtml.replaceAll("@pdUrl",pdUrl);
										  }
										  $("#botRecommendList").append(pdHtml);
									  }
									  if(data.scenicList!=null &&data.scenicList.length>0){
										  var pdHtml = "";
										  for(var i = 0; i< data.scenicList.length; i++){
											  var group = data.scenicList[i];
											  var title = group.nameCn;
											  var b2cMinPrice = group.minPrice;
											  var pdUrl = pageParam.ctx+"/tickets/"+group.scenicId+".html";
											  var images = group.images;
											  var imageStr = "";
											  if(images !=null && images.length>0){
												  imageStr = images[0].imageBo.prefix+"220X137"+images[0].imageBo.suffix;
											  }else{
												  imageStr = group.defaultIamgeVo.prefix+"220X137"+group.defaultIamgeVo.suffix;
											  }
											  pdHtml+=html;
											  pdHtml = pdHtml.replaceAll("@title",title);
											  pdHtml = pdHtml.replaceAll("@imgStr",imageStr);
											  pdHtml = pdHtml.replaceAll("@price",b2cMinPrice);
											  pdHtml = pdHtml.replaceAll("@pdUrl",pdUrl);
										  }
										  $("#botRecommendList").append(pdHtml);
									  }
									  if(data.hotelList!=null &&data.hotelList.length>0){
										  var pdHtml = "";
										  for(var i = 0; i< data.hotelList.length; i++){
											  var group = data.hotelList[i];
											  var title = group.nameCn;
											  var b2cMinPrice = group.minPrice;
											  var pdUrl = pageParam.ctx+"/hotel/"+group.hotelId+".html";
											  var imageStr = group.defaultImage.imageStr;
											  pdHtml+=html;
											  pdHtml = pdHtml.replaceAll("@title",title);
											  pdHtml = pdHtml.replaceAll("@imgStr",imageStr);
											  pdHtml = pdHtml.replaceAll("@price",b2cMinPrice);
											  pdHtml = pdHtml.replaceAll("@pdUrl",pdUrl);
										  }
										  $("#botRecommendList").append(pdHtml);
									  }
								  }
							  }
						  });
					  }
					  if(isNotNull(data.responseObject) && isNotNull(data.responseObject.content) && isNotNull(data.responseObject.content.length)){
						  if(data.responseObject.content.length == 1 && data.responseObject.content[0].allProductList.length == 0){
							  showBlank(true);
							  bangEvent();
						  }else {
							  if(needToInitFact){
								  initFactFilter(data.responseObject.content[0].factResult);
							  }
							  
							  hidePdtypeTab(data.responseObject.content[0].factResult);
							  
							  showBlank(false);
							  
							  oldSearchkeyWord = options.destName;
							  initContent(data.responseObject.content,data.responseObject.totalPages);
							  getHotelStar();
						  }
					  }else {
						  showBlank(true);
						  //showOrHideTypeNav({hasZc:false,hasWf:false,hasQz:false,hasPq:false,hasJd:false,hasYl:false,hasDdwl:false,hasZyx:false,hasGty:false});
						  bangEvent();
					  }
					 if(isNotNull(data.responseObject)){
						 if(parseInt(data.responseObject.totalElements) >20){
							 getRecommendList(8);
						 }else{
							 getRecommendList(4);
						 }
					 }
				  }else{
					  showBlank(true);
				  }
				  //orderOff();
			  },error: function() {
				  
			  }
		  });
    },1000);
   
}

//根据搜索结果显示类型标签
function hidePdtypeTab(factMap){
	//隐藏没有产品的Tap
	var hasZc = false;
	var hasWf = false;
	var hasQz = false;
	var hasPq = false;
	var hasJd = false;
	var hasYl = false;
	var hasDdwl = false;
	var hasZyx = false;
	var hasGty = false;
	for(var i=0; i<factMap.length; i++){
		var facetResult = factMap[i];
		//产品类型
		if(facetResult.fieldName == 'pdtype' && facetResult.fieldCountMap && getMapLength(facetResult.fieldCountMap) > 0){
			for(var key in facetResult.fieldCountMap){
				if(key == '10'){//租车
					hasZc = true;
				}
				if(key == '20'){//wifi
					hasWf = true;
				}
				if(key == '30'){//签证
					hasQz = true;
				}
				if(key == '40'){//景点
					hasPq = true;
				}
				if(key == '50'){//酒店
					hasJd = true;
				}
				if(key == '60'){//邮轮
					hasYl = true;
				}
				if(key == '75' || key == '80'){//当地玩乐
					hasDdwl = true;
				}
				if(key == '90' || key == '85'){//自由行
					hasZyx = true;
				}
				if(key == '100' || key== '70'){//跟团游
					hasGty = true;
				}
			}
		}
	}
	//showOrHideTypeNav({hasZc:hasZc,hasWf:hasWf,hasQz:hasQz,hasPq:hasPq,hasJd:hasJd,hasYl:hasYl,hasDdwl:hasDdwl,hasZyx:hasZyx,hasGty:hasGty});
}

function showEuropbanner(continents,keyword){
	if(keyword == '澳洲' || keyword == '澳大利亚' || keyword == '新西兰' || keyword == '澳新'){
		$(".Australia").show();
	}else {
		$(".Australia").hide();
	}
	var url = pageParam.ctx+"/search/isShowEurope.json";
	$.ajax({
		url: url,
		type: 'post',
		dataType: 'json',
		data: {continents:continents,keyword:keyword},
		complete:function(){
		},
		success: function (data) {
			if(data.success) {
				if(data.responseObject){
					$(".Europe").show();
				}else {
					$(".Europe").hide();
				}
			}
		},error: function() {
		}
	});
}

function showVenue(keyword){
	var url = pageParam.ctx+"/search/isShowVenue.json";
	$.ajax({
		url: url,
		type: 'post',
		dataType: 'json',
		data: {keyword:keyword},
		complete:function(){
		},
		success: function (data) {
			if(data.success) {
				var map = data.responseObject;
				if(map!=undefined){
					if(map['非洲']=="1"){
						$('.Africa').show()
					}else{
						$('.Africa').hide()
					}
					if(map['东南亚']=="1"){
						$('.SoutheastAsia').show() 
					}else{
						$('.SoutheastAsia').hide() 
					}
				}else {
					$('.Africa').hide()
					$('.SoutheastAsia').hide() 
				}
			}
		},error: function() {
		}
	});
}

function getQueryParams(){
	var options = {};
	searchfieldVal = $.trim($("#searchfield").val());
	if(!isNotNull(searchfieldVal)){
		return options;
	}
	returnDestName = searchfieldVal;
	$("#destName").val(searchfieldVal);
	
	var departureDays =  '';//出发日期
    var travelDaysRange =  $.query.get("travelDaysRange");//行程天数范围
    
	var endDays =  $.query.get("endDays");//行程结束日期
    var destName = $("#destName").val();//出发城市，实际是设置到SearchFields
    
    var deptPlaceName = $.query.get("deptPlaceName");//出发地名称
    var newDestName = $.query.get("newDestName");//目的地
    var pdTag =  $.query.get("pdTag");//产品主题
    var travelDays =  $.query.get("travelDays");//行程天数
    var supplierName =  $.query.get("supplierName");//供应商
    var pdLevel =  $.query.get("pdLevel");//产品等级
    var pdIsPlayTour =  $.query.get("pdIsPlayTour");//是否纯玩
    pdIsPlayTour = pdIsPlayTour + "";
    var selfSupport = $.query.get("selfSupport");//是否自营
    var isGiveWifi =  $.query.get("isGiveWifi");//是否免费WIFI
    var departureMon =  $.query.get("departureMon");//出发月份
    
    var order = '';//排序
    order = getOrder();
	
	if(order.split(",").length == 2){
		isUseGroup = false;
	}else {
		isUseGroup = true;
	}
	//取消使用分组PROJECT-15440
	isUseGroup = false;
	
	var priceRange = '';//价格范围
	priceRange = getPriceRange();
	
	options['departureDays']=departureDays;
	options['travelDaysRange']=travelDaysRange;
	options['endDays']=endDays;
	options['destName']=destName;
	options['deptPlaceName']=deptPlaceName;
	options['newDestName']=newDestName;
	options['pdTag']=pdTag;
	options['travelDays']=travelDays;
	options['priceRange']=priceRange;
	options['order']=order;
	options['supplierName']=supplierName;
	options['pdLevel']=pdLevel;
	options['pdIsPlayTour']=pdIsPlayTour;
	options['selfSupport']=selfSupport;
	options['isGiveWifi']=isGiveWifi;
	options['departureMon']=departureMon;
	options['isUseGroup']=isUseGroup;
	options['searchtype']=$.query.get("searchtype");
		
	options['page']=pageIndex;
	
	$(".choice-item-wrap").each(function(){
		var formitem = $(this).find(".choice-item").attr("formitem");
		var val = $(this).find(".choice-item").attr("itemval");
		if(formitem == 'departureDays'){
			if(val.indexOf('至')){
				var dateArr = val.split('至');
				val = dateArr[0];
				options['endDays'] = dateArr[1];
			}
		}
		options[formitem] = val;
	})
	if(isNotNull(options['departureDays'])){
		if(!isNotNull(options['endDays'])){
			options['endDays'] = options['departureDays'];
		}
	}
	
	return options;
}
