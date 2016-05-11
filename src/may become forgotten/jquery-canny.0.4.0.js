/*
 * Canny
 *
 * Version: 0.4
 * Author: some guy in a company
 *
 * Description:
 * 	- added option to open submenus as layers
 * 	- added option to copy the parent link into submenu
 * 	- added option to change back button layer
 * 	- added option to enable overlay
 * 	- updated css
 *
 * */

;(function($, window, document) {

	var pluginName = 'canny';
	var defaults = {
		pushContent: false,						// if true then the content is pushed away
		fixedView: true,						// whether the page can be scrolled if menu is open
		contentWrap: '',						// the element that contains the content
		cannyParent: null,						// the element that contains canny and contentWrap, if empty canny searches for nearest parent. Set if canny wraped by a <nav> or something else.
		openClass: 'canny-open',				// class when menu is open
		openingClass: 'canny-opening',			// class when menu is opening
		closingClass: 'canny-closing',			// class when menu is closing
		navElastic: 0,							// ### currently not used ###
		navOffset: 0,							// if set, the navi is visible by the amount in pixels; values 0 to n
		navToggle: '',							// class or id of toggle
		navPosition: 'left',					// position of menu; currentley "left" or "right"
		threshold: 'default',					// distance in pixels in which the navi snaps back; values: 'default' or any positive number
		transitionSpeed: 300,					// transition speed
		overlay: false,							// enable overlay
		closeButton: false,						// enable close button in main navi
		closeButtonLabel: '<span>X</span>',		// close button label
		dragToClose: false,						// drag menu to close
		layers: false,							// open submenus as layers
		backButtonLabel: '&laquo; Zurück',		// change label of back button
		copyParentLink: false					// copy parent link to submenu
	};

	var _self, _navi, _toggle;
	var clickedPointX, clickedPointY = 0;
	var thresholdDiff;
	var xPos = 0;
	var timeout = 0;
	var overlay = null;

	function Canny(element, options, index) {
		this.el = $(element);
		this.options = $.extend(true, {}, defaults, options);
		this.init();
	}

	function slideAllIn(target) {
		if(_self.options.fixedView == true) {
			if(_self.options.cannyParent != null ) {
				$(_navi.data('parent')).css('overflow', 'hidden');
			} else {
				target.parent().css('overflow', 'hidden');
			}
		}

		if(_self.options.cannyParent != null ) {
			$(_navi.data('parent')).addClass(_self.options.openingClass);
		} else {
			target.parent().addClass(_self.options.openingClass);
		}

		if(target.data('anker') == 'left') {
			target.css('left', 0);
		} else if(target.data('anker') == 'right') {
			target.css('right', 0);
		}

		_self._transition(target);

		if(target.data('overlay') == true) {
			overlay.addClass('fading-in');
		}

		target.data('content').addClass('canny-content-effects');

		if(target.data('pushContent') == true) {
			if(target.data('content') != '') {
				if(target.data('anker') == 'left') {
					target.data('content').css('left', target.data('width'));
				} else if(target.data('anker') == 'right') {
					target.data('content').css('left', -target.data('width'));
				}
				_self._transition(target.data('content'));
			}
		}

		thresholdDiff = 0;

		setTimeout(
			function() {
				target.data('status', 'open');

				if(_self.options.cannyParent != null ) {
					$(_navi.data('parent'))
						.removeClass(_self.options.openingClass)
						.addClass(_self.options.openClass);
				} else {
					target.parent()
						.removeClass(_self.options.openingClass)
						.addClass(_self.options.openClass);
				}

				if(target.data('overlay') == true) {
					if(overlay) {
						overlay
							.removeClass('fading-in')
							.addClass('visible');
					}
				}
			},
			_self.options.transitionSpeed
		);
	}

	function slideAllOut(target) {
		if(target.data('anker') == 'left') {
			target.css('left', -(target.data('width') - _self.options.navOffset));
		} else if(target.data('anker') == 'right') {
			target.css('right', -(target.data('width') - _self.options.navOffset));
		}

		if(_self.options.cannyParent != null ) {
			$(_navi.data('parent'))
				.removeClass(_self.options.openClass)
				.addClass(_self.options.closingClass);
		} else {
			target.parent()
				.removeClass(_self.options.openClass)
				.addClass(_self.options.closingClass);
		}

		_self._transition(target);

		if(target.data('overlay') == true) {
			if(overlay) {
				overlay.addClass('fading-out');
			}
		}

		target.data('content').removeClass('canny-content-effects');

		if(target.data('pushContent') == true) {
			if(target.data('content') != '') {
				target.data('content').css('left', (0 + _self.options.navOffset));
				_self._transition(target.data('content'));
			}
		}

		target.data('status', 'closed');

		timeout = setTimeout(
			function() {
				if(_self.options.cannyParent != null ) {
					$(_navi.data('parent'))
						.removeAttr('style')
						.removeClass(_self.options.closingClass);
				} else {
					target.parent()
						.removeAttr('style')
						.removeClass(_self.options.closingClass);
				}

				if(target.data('overlay') == true) {
					if(overlay) {
						overlay
							.removeClass('fading-out')
							.removeClass('visible');
					}
				}
			},
			_self.options.transitionSpeed
		);

		thresholdDiff = 0;
	}

	function setupCanny() {
		// outer width of navi
		_navi.data('width', _navi.outerWidth());
		_navi.data('height', _navi.outerHeight());

		// set the threshold
		if(_self.options.threshold == 'default') {
			_navi.data('threshold', (_navi.data('width') / 2));
		} else {
			_navi.data('threshold', _self.options.threshold);
		}

		// add overlay
		if(_self.options.overlay == true) {
			if($('#canny-overlay').length == 0) {
				$('body').append('<div id="canny-overlay"></div>');
				overlay = $('#canny-overlay');
			}
		}

		// positioning navi outside of canvas
		if(_self.options.navPosition == 'left') {
			_navi.css('left', '-' + (_navi.data('width') - _self.options.navOffset) + 'px');
		} else if(_self.options.navPosition == 'right') {
			_navi.css('right', '-' + (_navi.data('width') - _self.options.navOffset) + 'px');
		}

		// layered option is true
		// add class to main ul
		// add back-link to submenus
		if(_self.options.layers == true) {
			_navi.addClass('canny-layered');
			_navi.find('ul').each(function() {
				if($(this).parent('li')) {
					$(this).find('li').first().before('<li class="canny-back"><a href="#">'+_self.options.backButtonLabel+'</a></li>');
				}
			});
		}

		// copy parent link
		if(_self.options.copyParentLink == true) {
			_navi.find('ul').each(function() {
				if($(this).parent('li')) {
					var parentLink = $(this).parent('li').find('a').first();
					if(_self.options.layers == true) {
						$(this).find('li').first().after('<li><a href="'+parentLink.attr('href')+'">'+parentLink.text()+'</a></li>');
					} else {
						$(this).find('li').first().before('<li><a href="'+parentLink.attr('href')+'">'+parentLink.text()+'</a></li>');
					}
				}
			});
		}

		// add close button
		if(_self.options.closeButton == true) {
			_navi.find('li').first().before('<li><a class="canny-close">'+_self.options.closeButtonLabel+'</a></li>');
		}

		// get submenus and assign css classes to them
		if(_navi.find('ul').length > 0) {
			searchSubmenu(_navi);
			function searchSubmenu(list) {
				list.children('li').each(function() {
					if($(this).children('ul').length > 0) {

						$(this).addClass('canny-parent');
						$(this).children('ul').each(function() {
							$(this).addClass('canny-submenu');
						});

						searchSubmenu($(this).children('ul'));
					}
				});
			}
		}

		// give container some css
		_navi.data('content')
			.css('position', 'relative')
			.css('left', (0 + _self.options.navOffset) + 'px');
	}

	/**************************************************************/
	/*	usefull functions                                         */
	/**************************************************************/

	function naviEventDown(e, $this) {
		clickedPointX = (e.pageX || e.originalEvent.touches[0].pageX);
		clickedPointY = (e.pageY || e.originalEvent.touches[0].pageY);
		$this.data('mousedown', true);
	}

	function naviEventUp(e, $this) {
		$this.data('mousedown', false);
		$this.data('dragOrientation', null);
	}

	function getMovDirection(e, $this) {
		if($this.data('mousedown') == true) {
			if($this.data('dragOrientation') == null) {
				var deltaX = Math.abs(clickedPointX - (e.pageX || e.originalEvent.touches[0].pageX));
				var deltaY = Math.abs(clickedPointY - (e.pageY || e.originalEvent.touches[0].pageY));

				if (deltaX > deltaY || deltaX == deltaY) {
					$this.data('dragOrientation', 'horizontal');
				} else if (deltaX < deltaY) {
					$this.data('dragOrientation', 'vertical');
				}
			}
		}
	}

	function dragNavi(e, $this) {
		// if mouse button is down
		if($this.data('mousedown') == true) {

			getMovDirection(e, $this);

			if($this.data('dragOrientation') == 'horizontal') {
				xPos = (clickedPointX - (e.pageX || e.originalEvent.touches[0].pageX)) * -1;

				// check if mouse cursor is moving a set distance
				if($this.data('dragged') == true && xPos < 0) {
					// if status "dragged" is true then calculate positions of navi
					$this.css('left', xPos);

					// and content, if pushContent is active
					if($this.data('pushContent') == true) {
						if($this.data('content') != '') {
							if($this.data('anker') == 'left') {
								$this.data('content').css('left', $this.data('width') + xPos);
							} else if($this.data('anker') == 'right') {
								$this.data('content').css('left', -$this.data('width') + xPos);
							}
						}
					}
				} else if(Math.abs(xPos) > 10 && $this.data('dragged', false)) {
					// set navi to status dragged
					$this.data('dragged', true);
					_self._noTransition($this);
					_self._noTransition($this.data('content'));
				}
			}
		}
	}

	function closeDraggedNavi(e, $this) {
		var target = $(e.target);
		$this.data('mousedown', false);
		$this.data('dragOrientation', null);
		if($this.data('dragged') == true) {
			$this.data('dragged', false);
			if(Math.abs(xPos) > $this.data('threshold')) {
				_self.close($this);
			} else {
				_self.open($this);
			}
			if(target.is('A')) {
				e.preventDefault();
			}
		}
	}

	function layersReleaseCheck(e, $this) {
		if($this.data('dragOrientation') == null) {
			var $target = $(e.target);

			if($target.is('A')) {
				var $parent = $target.parent();

				if($parent.hasClass('canny-back') == true) {
					e.preventDefault();
					$parent.parent().removeClass('canny-sub-visible');
					$parent.parents('.canny-parent').removeClass('canny-sub-open');
				}

				if($parent.hasClass('canny-parent') == true) {
					e.preventDefault();
					var $sub = $target.parent('li').find('.canny-submenu').first();
					if($sub.hasClass('canny-sub-visible') == true) {
						$sub.removeClass('canny-sub-visible');
						$target.parent('li').removeClass('canny-sub-open');
					} else {
						$sub.addClass('canny-sub-visible');
						$target.parent('li').addClass('canny-sub-open');
					}
				}

				if($target.hasClass('canny-close')) {
					e.preventDefault();
					_self.close($target.parents('.canny'));
				}
			}
		}
	}

	Canny.prototype = {
		init: function() {
			_self = this;
			_navi = this.el;
			_toggle = $(this.options.navToggle);
			_toggle.data('target', _navi);
			_navi.data('status', 'closed');
			_navi.data('dragOrientation', null);
			_navi.data('pushContent', this.options.pushContent);
			_navi.data('anker', this.options.navPosition);
			_navi.data('content', $(this.options.contentWrap));
			_navi.data('parent', $(this.options.cannyParent));
			_navi.data('overlay', this.options.overlay);
			_navi.data('width', 0);
			_navi.data('height', 0);
			_navi.data('threshold', 0);
			_navi.data('dragged', false);
			_navi.data('mousedown', false);

			setupCanny();

			this.events();
		},

		events: function() {
			// navi toggle
			if(_toggle != '') {
				_toggle.on(
					{
						'touchstart': function(e) {
							e.preventDefault();
						},

						'touchend click': function(e) {
							e.preventDefault();

							if($(this).data('target').data('status') == 'closed') {
								_self.open($(this).data('target'));
							} else {
								_self.close($(this).data('target'));
							}
						}
					}
				);
			}

			if(_self.options.dragToClose == true) {
				_navi.on({
					dragstart: function(e) {
						// stops dragging of html elements
						e.preventDefault();
					},
					mousedown: function(e) {
						naviEventDown(e, $(this));
					},
					mouseup: function(e) {
						closeDraggedNavi(e, $(this));
					},
					mousemove: function(e) {
						dragNavi(e, $(this));
					},
					touchstart: function(e) {
						naviEventDown(e, $(this));
					},
					touchend: function(e) {
						closeDraggedNavi(e, $(this));
					},
					touchmove: function(e) {
						dragNavi(e, $(this));
					}
				});
			}

			if(_self.options.layers == true) {
				_navi.on({
					dragstart: function(e) {
						// stops dragging of html elements
						e.preventDefault();
					},
					mousedown: function(e) {
						naviEventDown(e, $(this));
					},
					mouseup: function(e) {
						layersReleaseCheck(e, $(this));
						naviEventUp(e, $(this));
					},
					mousemove: function(e) {
						getMovDirection(e, $(this));
					},
					touchstart: function(e) {
						naviEventDown(e, $(this));
					},
					touchend: function(e) {
						layersReleaseCheck(e, $(this));
						naviEventUp(e, $(this));
					},
					touchmove: function(e) {
						getMovDirection(e, $(this));
					}
				});
			}
		},

		open: function(target) {
			slideAllIn(target);
		},

		close: function(target) {
			slideAllOut(target);
		},

		unCanny: function() {
			this.$el.removeData();
		},

		_transition: function(obj) {
			obj
				.css('-webkit-transition', 'all '+(_self.options.transitionSpeed / 1000)+'s')
				.css('-moz-transition', 'all '+(_self.options.transitionSpeed / 1000)+'s')
				.css('-o-transition', 'all '+(_self.options.transitionSpeed / 1000)+'s')
				.css('-transition', 'all '+(_self.options.transitionSpeed / 1000)+'s');
		},

		_noTransition: function(obj) {
			obj
				.css('-webkit-transition', 'none')
				.css('-moz-transition', 'none')
				.css('-o-transition', 'none')
				.css('-transition', 'none');
		}
	};

	$.fn[pluginName] = function(options) {
		var args = Array.prototype.slice.call(arguments, 1);

		return this.each(function() {
			var item = $(this), instance = item.data('Canny');
			if(!instance) {
				// create plugin instance and save it in data
				item.data('Canny', new Canny(this, options));
			} else {
				// if instance already created call method
				if(typeof options === 'string') {
					instance[options].apply(instance, args);
				}
			}
		});
	}

}(window.jQuery, window, document));