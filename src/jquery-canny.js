/*
 * Canny
 *
 * Version: 0.6.1
 * Author: Herr Freigang
 * Web: http://www.herrfreigang.de
 *
 * # TODO:
 * - Bug on line 496: close button
 *
 * v 0.6.1
 * - added 'top' to navPosition
 * - fixed: openingClass and closingClass not set correctly
 * - removed unused options
 * - removed unused function
 * - removed version-number in file name
 *
 * v 0.6.0
 * - fixed: now opens submenus even if layers are disabled
 * - fixed: close-button now works properly
 * - fixed: drag to close works now with right-aligned navigations
 * - added missing options to instance data
 * - renamed some functions and some data
 *
 * */

;(function($, window, document) {

	var pluginName = 'canny';
	var defaults = {
		pushContent: false,								// if true then the content is pushed away
		fixedView: true,								// whether the page can be scrolled if menu is open
		contentWrap: '',								// the element that contains the content
		cannyParent: null,								// the element that contains canny and contentWrap, if empty canny searches for nearest parent. Set if canny wraped by a <nav> or something else.
		openClass: 'canny-open',						// class when menu is open
		openingClass: 'canny-opening',					// class when menu is opening
		closingClass: 'canny-closing',					// class when menu is closing
		navOffset: 0,									// if set, the navi is visible by the amount in pixels; values 0 to n
		navToggle: '',									// class or id of toggle
		navPosition: 'left',							// position of menu; currentley "left" or "right"
		threshold: 'default',							// distance in pixels in which the navi snaps back; values: 'default' or any positive number
		transitionSpeed: 300,							// transition speed
		overlay: false,									// enable overlay
		closeButton: false,								// enable close button in main navi
		closeButtonLabel: '<span>Close</span>',			// close button label
		dragToClose: false,								// drag menu to close
		layers: false,									// open submenus as layers
		backButtonLabel: '&laquo; Back',				// change label of back button
		copyParentLink: false,							// copy parent link to submenu
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

	// =================================================
	// SETUP CANNY
	// =================================================
	
	function setupCanny(target) {
		// add width to data
		target.data('width', target.outerWidth());

		// set the threshold
		if(target.data('threshold') == 'default') {
			target.data('threshold', (target.data('width') / 2));
		} else {
			target.data('threshold', target.data('threshold'));
		}

		// add overlay
		if(target.data('overlay') == true) {
			if($('#canny-overlay').length == 0) {
				$('body').append('<div id="canny-overlay"></div>');
				overlay = $('#canny-overlay');
			}
		}

		// layered option is true
		// add class to main ul
		// add back-link to submenus
		if(target.data('layers') == true) {
			target.addClass('canny-layered');
			target.find('ul').each(function() {
				if($(this).parent('li')) {
					$(this).find('li').first().before('<li class="canny-back"><a href="#">' + target.data('backButtonLabel') + '</a></li>');
				}
			});
		}

		// copy parent link
		if(target.data('copyParentLink') == true) {
			target.find('ul').each(function() {
				if($(this).parent('li')) {
					var parentLink = $(this).parent('li').find('a').first();
					if(target.data('layers') == true) {
						$(this).find('li').first().after('<li><a href="' + parentLink.attr('href')+'">' + parentLink.text() + '</a></li>');
					} else {
						$(this).find('li').first().before('<li><a href="' + parentLink.attr('href')+'">' + parentLink.text() + '</a></li>');
					}
				}
			});
		}

		// add close button
		if(target.data('closeButton') == true) {
			target.find('li').first().before('<li><a class="canny-close">' + target.data('closeButtonLabel') + '</a></li>');
		}

		//console.log(2, target.width(), target.height());

		// get submenus and assign css classes to them
		if(target.find('ul').length > 0) {
			searchSubmenus(target, target.data('layers'));
		}

		// give container some css
		target.data('contentWrap')
			.css('position', 'relative')
			.css('left', (0 + target.data('navOffset')) + 'px')
			.css('top', (0 + target.data('navOffset')) + 'px');

		// add actual height to data
		target.data('height', target.outerHeight());

		// positioning navi outside of canvas
		if(target.data('navPosition') == 'left') {
			target
				.addClass('canny-align-left')
				.css('left', '-' + (target.data('width') - target.data('navOffset')) + 'px');
		} else if(target.data('navPosition') == 'right') {
			target
				.addClass('canny-align-right')
				.css('right', '-' + (target.data('width') - target.data('navOffset')) + 'px');
		} else if(target.data('navPosition') == 'top') {
			target
				.addClass('canny-align-top')
				.css('top', '-' + (target.data('height') - target.data('navOffset')) + 'px');
		}
	}

	// =================================================
	// SLIDE CANNY IN
	// =================================================

	function slideAllIn(target) {
		if(target.data('fixedView') == true) {
			if(target.data('cannyParent') != null ) {
				$(target.data('cannyParent')).css('overflow', 'hidden');
			} else {
				target.parent().css('overflow', 'hidden');
			}
		}

		if(target.data('cannyParent') != null ) {
			$(target.data('cannyParent')).addClass(target.data('openingClass'));
		} else {
			target.parent().addClass(target.data('openingClass'));
		}

		if(target.data('navPosition') == 'left') {
			target.css('left', 0);
		} else if(target.data('navPosition') == 'right') {
			target.css('right', 0);
		} else if(target.data('navPosition') == 'top') {
			target.css('top', 0);
		}

		_self._transition(target);

		if(target.data('overlay') == true) {
			overlay.addClass('fading-in');
		}

		if(target.data('pushContent') == true) {
			_self._transition(target.data('contentWrap'), target);

			if(target.data('contentWrap') != '') {
				if(target.data('navPosition') == 'left') {
					target.data('contentWrap').css('left', target.data('width'));

				} else if(target.data('navPosition') == 'right') {
					target.data('contentWrap').css('left', -target.data('width'));

				} else if(target.data('navPosition') == 'top') {
					target.data('contentWrap').css('top', (target.data('height')));

				}
			}
		}

		thresholdDiff = 0;

		setTimeout(
			function() {
				target.data('status', 'open');

				if(target.data('cannyParent') != null ) {
					$(target.data('cannyParent'))
						.removeClass(target.data('openingClass'))
						.addClass(target.data('openClass'));
				} else {
					target.parent()
						.removeClass(target.data('openingClass'))
						.addClass(target.data('openClass'));
				}

				if(target.data('overlay') == true) {
					if(overlay) {
						overlay
							.removeClass('fading-in')
							.addClass('visible');
					}
				}
			},
			target.data('transitionSpeed')
		);
	}

	// =================================================
	// SLIDE CANNY OUT
	// =================================================

	function slideAllOut(target) {
		if(target.data('navPosition') == 'left') {
			target.css('left', -(target.data('width') - target.data('navOffset')));
		} else if(target.data('navPosition') == 'right') {
			target.css('right', -(target.data('width') - target.data('navOffset')));
		} else if(target.data('navPosition') == 'top') {
			target.css('top', -(target.data('height') - target.data('navOffset')));
		}

		if(target.data('cannyParent') != null ) {
			$(target.data('cannyParent'))
				.removeClass(target.data('openClass'))
				.addClass(target.data('closingClass'));
		} else {
			target.parent()
				.removeClass(target.data('openClass'))
				.addClass(target.data('closingClass'));
		}

		_self._transition(target);

		if(target.data('overlay') == true) {
			if(overlay) {
				overlay.addClass('fading-out');
			}
		}

		if(target.data('pushContent') == true) {
			_self._transition(target.data('contentWrap'), target);

			if(target.data('contentWrap') != '') {
				if(target.data('navPosition') == 'left') {
					target.data('contentWrap').css('left', (0 + target.data('navOffset')));

				} else if(target.data('navPosition') == 'right') {
					target.data('contentWrap').css('left', (0 + target.data('navOffset')));

				} else if(target.data('navPosition') == 'top') {
					target.data('contentWrap').css('top', (0 + target.data('navOffset')));

				}
			}
		}

		target.data('status', 'closed');

		timeout = setTimeout(
			function() {
				if(target.data('cannyParent') != null ) {
					$(target.data('cannyParent'))
						.removeAttr('style')
						.removeClass(target.data('closingClass'));
				} else {
					target.parent()
						.removeAttr('style')
						.removeClass(target.data('closingClass'));
				}

				if(target.data('overlay') == true) {
					if(overlay) {
						overlay
							.removeClass('fading-out')
							.removeClass('visible');
					}
				}
			},
			target.data('transitionSpeed')
		);

		thresholdDiff = 0;
	}

	// =================================================
	// SEARCHES SUBMENUS
	// =================================================

	function searchSubmenus($this, layers) {
		$this.children('li').each(function() {
			if($(this).children('ul').length > 0) {

				if(layers == false) {
					$(this).addClass('canny-parent with-toggle');
					$(this).append('<button class="canny-submenu-toggle"><span></span></button>');
				} else {
					$(this).addClass('canny-parent');
				}

				$(this).children('ul').each(function() {
					$(this).addClass('canny-submenu');
				});

				searchSubmenus($(this).children('ul'), layers);
			}
		});
	}

	// =================================================
	// SOME EVENTS
	// =================================================
	
	function naviEventDown(e, $this) {
		clickedPointX = (e.pageX || e.originalEvent.touches[0].pageX);
		clickedPointY = (e.pageY || e.originalEvent.touches[0].pageY);
		$this.data('mousedown', true);
	}

	function naviEventUp(e, $this) {
		$this.data('mousedown', false);
		$this.data('orientationOfMovement', null);
	}

	// =================================================
	// GET ORIENTATION OF MOVEMENT
	// =================================================
	
	function getOrientationOfMovement(e, $this) {
		if($this.data('mousedown') == true) {
			if($this.data('orientationOfMovement') == null) {
				var deltaX = Math.abs(clickedPointX - (e.pageX || e.originalEvent.touches[0].pageX));
				var deltaY = Math.abs(clickedPointY - (e.pageY || e.originalEvent.touches[0].pageY));

				if (deltaX > deltaY || deltaX == deltaY) {
					$this.data('orientationOfMovement', 'horizontal');
				} else if (deltaX < deltaY) {
					$this.data('orientationOfMovement', 'vertical');
				}
			}
		}
	}

	// =================================================
	// CHECK DIRECTION OF MOVEMENT
	// =================================================

	var oldX = 0;
	var oldY = 0;

	function direction(e, $this) {
		var currentX = (e.pageX || e.originalEvent.touches[0].pageX);
		var currentY = (e.pageY || e.originalEvent.touches[0].pageY);

		if($this.data('orientationOfMovement') == 'horizontal') {
			if(oldX > currentX) {
				$this.data('directionOfMovement', 'left');
			}

			if(oldX < currentX) {
				$this.data('directionOfMovement', 'right');
			}
		}
		
		if($this.data('orientationOfMovement') == 'vertical') {
			if(oldY > currentY) {
				$this.data('directionOfMovement', 'up');
			}

			if(oldY < currentY) {
				$this.data('directionOfMovement', 'down');
			}
		}

		oldX = currentX;
		oldY = currentY;
	}

	// =================================================
	// DRAG NAVI
	// =================================================
	
	function dragNavi(e, $this) {

		// if mouse button is down
		if($this.data('mousedown') == true) {
			getOrientationOfMovement(e, $this);
			direction(e, $this);

			if($this.data('orientationOfMovement') == 'horizontal') {
				xPos = (clickedPointX - (e.pageX || e.originalEvent.touches[0].pageX)) * -1;



				// check if mouse cursor is moving a set distance
				if($this.data('navPosition') == 'left') {
					if($this.data('dragged') == true && xPos < 0) {
						// if status "dragged" is true then calculate positions of navi
						$this.css('left', xPos);

						// and content, if pushContent is active
						if($this.data('pushContent') == true) {
							if($this.data('contentWrap') != '') {
								$this.data('contentWrap').css('left', $this.data('width') + xPos);
							}
						}
					} else if(Math.abs(xPos) > 10 && $this.data('dragged', false)) {
						// set navi to status dragged
						$this.data('dragged', true);
						_self._noTransition($this);
						_self._noTransition($this.data('contentWrap'));
					}
				} else if($this.data('navPosition') == 'right') {
					if($this.data('dragged') == true && xPos > 0) {
						// if status "dragged" is true then calculate positions of navi
						$this.css('right', -xPos);

						// and content, if pushContent is active
						if($this.data('pushContent') == true) {
							if($this.data('contentWrap') != '') {
								$this.data('contentWrap').css('left', -$this.data('width') + xPos);
							}
						}
					} else if(Math.abs(xPos) > 10 && $this.data('dragged', false)) {
						// set navi to status dragged
						$this.data('dragged', true);
						_self._noTransition($this);
						_self._noTransition($this.data('contentWrap'));
					}
				}
			}
		}
	}

	// =================================================
	// CLOSE NAVI IF DRAGGED
	// =================================================

	function closeDraggedNavi(e, $this) {
		var target = $(e.target);
		$this.data('mousedown', false);
		$this.data('orientationOfMovement', null);
		if($this.data('dragged') == true) {
			$this.data('dragged', false);
			if(Math.abs(xPos) >= $this.data('threshold')) {
				if($this.data('directionOfMovement') == $this.data('navPosition')) {
					_self.close($this);
				}
			} else {
				_self.open($this);
			}
			if(target.is('A')) {
				e.preventDefault();
			}
		}
	}

	// =================================================
	// SUBMENU TOGGLE
	//
	// opens and closes submenus depending on activated
	// layers-option and clicked target
	// =================================================

	function toggleSubmenus(e, $this) {
		if($this.data('orientationOfMovement') == null) {
			
			// even if the click targets the span the parent button will be the toggle
			var toggle = $($(e.target).is('SPAN') ? e.target.parentNode : e.target);
			var goodToGo = false;

			if($this.data('layers') == false) {
				if(toggle.is('BUTTON')) {
					goodToGo = true;
				}
			} else if($this.data('layers') == true) {
				if(toggle.is('A')) {
					goodToGo = true;
				}
			}

			// close button
			// BUG: something's wrong, if there is another canny open
			if(toggle.hasClass('canny-close')) {
				e.preventDefault();
				_self.close(toggle.parents('.canny'));
			}

			// opens and closes submenu
			if(goodToGo) {
				var $parent = toggle.parent();

				if($parent.hasClass('canny-back') == true) {
					e.preventDefault();
					$parent.parent().removeClass('canny-sub-visible');
					$parent.parents('.canny-parent').removeClass('canny-sub-open');
				}

				if($parent.hasClass('canny-parent') == true) {
					e.preventDefault();
					var $sub = $parent.find('.canny-submenu').first();

					if($sub.hasClass('canny-sub-visible') == true) {
						$sub.removeClass('canny-sub-visible');
						$parent.removeClass('canny-sub-open');
					} else {
						$sub.addClass('canny-sub-visible');
						$parent.addClass('canny-sub-open');
					}
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
			_navi.addClass('canny');

			_navi.data('status', 'closed');
			_navi.data('orientationOfMovement', null);
			_navi.data('directionOfMovement', null);
			_navi.data('width', 0);
			_navi.data('height', 0);
			_navi.data('dragged', false);
			_navi.data('mousedown', false);
			_navi.data('pushContent', this.options.pushContent);
			_navi.data('fixedView', this.options.fixedView);
			_navi.data('contentWrap', $(this.options.contentWrap));
			_navi.data('cannyParent', $(this.options.cannyParent));
			_navi.data('openClass', this.options.openClass);
			_navi.data('openingClass', this.options.openingClass);
			_navi.data('closingClass', this.options.closingClass);
			_navi.data('navOffset', this.options.navOffset);
			_navi.data('navToggle', this.options.navToggle);
			_navi.data('navPosition', this.options.navPosition);
			_navi.data('threshold', this.options.threshold);
			_navi.data('transitionSpeed', this.options.transitionSpeed);
			_navi.data('overlay', this.options.overlay);
			_navi.data('closeButton', this.options.closeButton);
			_navi.data('closeButtonLabel', this.options.closeButtonLabel);
			_navi.data('dragToClose', this.options.dragToClose);
			_navi.data('layers', this.options.layers);
			_navi.data('backButtonLabel', this.options.backButtonLabel);
			_navi.data('copyParentLink', this.options.copyParentLink);

			setupCanny(_navi);

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

			if(_self.options.closeButton == true) {
				_navi.on('click', '.canny-close', function() {
					_self.close(_navi);
				});
			}

			_navi.on({
				dragstart: function(e) {
					// stops dragging of html elements
					e.preventDefault();
				},
				mousedown: function(e) {
					naviEventDown(e, $(this));
				},
				mouseup: function(e) {
					toggleSubmenus(e, $(this));
				},
				touchstart: function(e) {
					naviEventDown(e, $(this));
				},
				touchend: function(e) {
					toggleSubmenus(e, $(this));
				}
			});

			if(_self.options.dragToClose == true) {
				_navi.on({
					mouseup: function(e) {
						closeDraggedNavi(e, $(this));
					},
					mousemove: function(e) {
						dragNavi(e, $(this));
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
					mouseup: function(e) {
						naviEventUp(e, $(this));
					},
					mousemove: function(e) {
						getOrientationOfMovement(e, $(this));
					},
					touchend: function(e) {
						naviEventUp(e, $(this));
					},
					touchmove: function(e) {
						getOrientationOfMovement(e, $(this));
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

		_transition: function(target, navi) {
			navi = typeof navi == 'undefined' ? target : navi;
			target
				.css('-webkit-transition', 'all '+(navi.data('transitionSpeed') / 1000)+'s')
				.css('-moz-transition', 'all '+(navi.data('transitionSpeed') / 1000)+'s')
				.css('-o-transition', 'all '+(navi.data('transitionSpeed') / 1000)+'s')
				.css('-transition', 'all '+(navi.data('transitionSpeed') / 1000)+'s');
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