var _ = require('lodash');
var Vue = require('vue');
var moment = require('moment');

var $ = require('../lib/zepto.js');
var Util = require('../util/widgets.js');
var Dialogs = require('../util/dialogs');
var ScrollBottomPlus = require('../util/scrollBottomPlus.js');

moment.locale('zh-cn');

function RedBagModal () {}

_.extend(RedBagModal.prototype, {
    template: require('./templates/redBagModal.jade'),
    open: function () {
        var that = this;
        var template = this.template;

        $.get('/my/myredbag', function(data){
            if (!data || !data.redEnvelopes) {
                return;
            }

            Dialogs.pop(template);
            that.render(data.redEnvelopes);
        });
    },

    render: function (redBagList) {
        var data = {
            currentTab: 1,
            hasNoRedBag: _.isEmpty(redBagList),
            redBagList: redBagList
        };

        var threshold = 3 * 24 * 60 * 60 * 1e3;
        _.each(redBagList, function (redBag) {
            var endTime = moment(redBag.endTime, 'YYYY-MM-DD HH:mm:ss');
            redBag.expiredTime = endTime.format('YYYY-MM-DD');

            var remainTime = endTime - new Date();
            if (remainTime > 0 && remainTime <= threshold) {
                redBag.remainTime = moment.duration(remainTime).humanize();
            }
        });

        var groupedRedBag = _.groupBy(redBagList, function (redBag) {
            return parseInt(redBag.status, 10);
        });

        data.unusedCount = (groupedRedBag['1'] || []).length;
        data.expiredCount = (groupedRedBag['2'] || []).length;
        data.usedCount = (groupedRedBag['3'] || []).length;

        new Vue({
            el: '#redBag',
            data: data,
            methods: {
                changeTab: function (index) {
                    this.currentTab = index;
                }
            }
        });
    },

    close: function () {}
});


var Mine = {
    init: function () {
        this.initField();
        this.initEvent();
        this.fetchNews(1);
    },
    initField: function () {
        var $wrap = $('.wrap');

        // 用户足迹相关
        this.$newsList = $wrap.find('.userNews .mylistbox');
        this.$newsEmpty = $wrap.find('.userNews .empty');
        this.$newsLoading = $wrap.find('.userNews .loading');
        this.newsLength = this.$newsList.find('li[data-id]').length;
        this.newsPageIndex = 1;

        // 红包相关
        this.$openRedBag = $wrap.find('[data-item="myredbag"]');

        this.$wrap = $wrap;
        this.$body = $('body');
    },
    initEvent: function () {
        var mine = this;

        // 打开红包层
        this.$openRedBag.on('click', this.openRedBag);

        // 关闭卡包，红包等层
        this.$body.on('click', '.maskbtn .btn_close', this.closeMask);

        this.$newsList.on('click', '.myclose', this.deleteNews.bind(this));

        // 初始化滚动加载组件
        if (this.newsLength > 0) {
            ScrollBottomPlus.render({
                el: this.$newsList,
                footer: ' ',
                app_el: this.$newsList,
                callback: function(){
                    mine.fetchNews(mine.newsPageIndex + 1);
                }
            });
        }
    },
    fetchNews: function (pageIndex) {
        var mine = this;

        if (this.fetchNewsLock) {
            return;
        }

        this.fetchNewsLock = true;
        this.$newsLoading.show();

        $.get('/my/usernews/' + pageIndex, function (res) {
            mine.fetchNewsLock = false;
            mine.$newsLoading.hide();

            if (res) {
                mine.$newsList.append(res);
                mine.newsLength = mine.$newsList.find('li[data-id]').length;
                mine.newsPageIndex = pageIndex;
            }
        });
    },
    deleteNews: function (event) {
        event.preventDefault();

        var mine = this;
        var $close = $(event.currentTarget);
        var $news = $close.parents('li[data-id]');
        var newsId = $news.data('id');

        $.get('/my/usernews/delete/' + newsId, function (res) {
            if (!res.err) {
                $news.remove();

                if (--mine.newsLength <= 0) {
                    mine.fetchNews(1);
                }
            }
        });
    },
    closeMask: function (event) {
        var $closeBtn = $(event.currentTarget);
        $closeBtn.parents('.mask').remove();
    },
    openRedBag: function (event) {
        new RedBagModal().open();
    }
};

$(document).ready(function() {
	var movienewsPageindex = 1;
    var mylistbox = $('.mylistbox');
	var mymenuEl = $('.mymenu'),
		itemMask, itemMaskEl;

	mymenuEl.on('click', 'li', function(evt){
		var el = $(this),
			item = el.data('item');
		itemMethod(item);
	})

	//加载足迹
	// function getmylistbox(){
 //        var _url = '/my/usernews/'+ sourceId +'/' + movienewsPageindex;
 //        $.get(_url, function(data) {
 //            if(data == ""){
 //            	alert('a');
 //                ScrollBottomPlus.remove();
 //                return;
 //            }
 //            // var _el = $('<div></div>').html(data).appendTo(hotmovie);
 //            mylistbox.html(mylistbox.html() + data)
 //            ScrollBottomPlus.gotoBottomShowed = false;
 //            alert('b');
 //        });

 //    }

 //    ScrollBottomPlus.render({
 //        el: '.mylistbox',
 //        app_el: ' ',
 //        footer: ' ',
 //        callback: function(){
 //            movienewsPageindex++;
 //            getmylistbox();
 //        }
 //    })

	function itemMethod(item){
        if (item === 'myredbag') {
            return;
        }

		switch(item){
			case 'myorders':
				itemMask = 'mask_myorder';
				break;
			case 'mypiao':
				itemMask = 'mask_mypiao';
				break;
			case 'myredbag':
				itemMask = 'mask_myredbag';
				break;

		}
		if(item && item != ''){
			var loading = Dialogs.Loading();
			var url = '/my/' + item
			$.get(url, function(return_html){
				setTimeout(function(){
					loading(true);
				}, 100)

				Dialogs.pop(return_html);
				maskMethod();
			})
		}

	}

	function maskMethod(){
		var maskotherEl = $('.maskother'),
			topEl, el, orderboxEl;

		if(maskotherEl.length > 0){
			maskotherEl.on('click', function(evt){
				el = evt.target;
				if(el.tagName == 'A'){
					orderboxEl = maskotherEl.find('.orderbox');
					if($(el).hasClass('btn_back')){
						orderboxEl.show();
						itemMaskEl.remove();
						return;
					}

					getMaskHtml(maskotherEl, orderboxEl)
				}
			})
		}
	}

	function getMaskHtml(el, orderboxEl){
		if(el && el.length > 0){
			var url = '/my/' + itemMask;
			$.get(url, function(return_html){
				orderboxEl.hide();
				itemMaskEl = $(return_html).appendTo(el);
			})
		}

	}
	//-发现弹出 即将开启
	var _findbox = $('#findbox ');
    _findbox.on('click',function(){
        _findbox.addClass('showtips')  ;
        setTimeout(function(){
            _findbox.removeClass('showtips')  ;
        }, 1000);
    })

    //- 我的页面切换
    $('.navmy li').on('click',function(){
    	$(this).addClass('curr').siblings().removeClass('curr');
     	$('.subtablist').eq($('.navmy li').index(this)).show().siblings('.subtablist').hide();
    })
    //
    ////-删除我的足迹
    //var myli = $('.mylistbox li');
    //var mylen = myli.length;
    //$('.myclose').on('click',function(){
    //	$(this).parent().parent().remove();
    //	if(mylen == 1){
    //		$('.empty').show();
    //	}
    //	mylen--;
    //})

    Mine.init();
});
