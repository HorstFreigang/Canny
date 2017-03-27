/*
 * Canny
 *
 * Version: 0.7.1
 * Author: Herr Freigang
 * Web: http://www.herrfreigang.de
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
		transitionSpeed: 300,							// transition speed in milliseconds
		overlay: false,									// enable overlay
		useCloseButton: false,							// enable close-button in main navi
		closeButton: '.canny-close',					// close-button
		closeButtonLabel: '<span>Close</span>',			// close-button label
		dragToClose: false,								// drag menu to close
		layers: false,									// open submenus as layers
		backButtonLabel: '&laquo; Back',				// change label of back-button
		copyParentLink: false,							// copy parent link to submenu
	};

	var _self, _navi, _toggle, _closeBtn;
	var clickedPointX, clickedPointY = 0;
	var thresholdDiff;
	var xPos = 0;
	var timeout = 0;
	var overlay = null;
    var oldX = 0;
    var oldY = 0;

	function Canny(element, options, index) {
		this.el = $(element);
		this.options = $.extend(true, {}, defaults, options);
		this.init();
	}

    /**
	 * Setup Canny
	 *
     * @param target
     */
	
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
					$(this).find('li').first().before('<li class="canny-back"><button>' + target.data('backButtonLabel') + '</button></li>');
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
		if(target.data('useCloseButton') == true) {
			target.find('li').first().before('<li class="canny-close"><button>' + target.data('closeButtonLabel') + '</button></li>');
		}

		// get submenus and assign css classes to them
		if(target.find('ul').length > 0) {
			searchSubmenus(target, target.data('layers'));
		}

		// give container some css
		target.data('contentWrap')
			.css('position', 'relative')
			.css('left', (0 + target.data('navOffset')) + 'px')
			.css('top', (0 + target.data('navOffset')) + 'px');

		// adding classes which defines alignment
		if(target.data('navPosition') == 'left') {
			target.addClass('canny-align-left');
		} else if(target.data('navPosition') == 'right') {
			target.addClass('canny-align-right');
		} else if(target.data('navPosition') == 'top') {
			target.addClass('canny-align-top');
		}
	}

    /**
	 * Positioning navi outside of canvas
	 *
     * @param target
     */

	function alignOutside(target) {
		if(target.data('navPosition') == 'left') {
			target.css('left', '-' + (target.data('width') - target.data('navOffset')) + 'px');
		} else if(target.data('navPosition') == 'right') {
			target.css('right', '-' + (target.data('width') - target.data('navOffset')) + 'px');
		} else if(target.data('navPosition') == 'top') {
			target.css('top', '-' + (target.data('height') - target.data('navOffset')) + 'px');
		}
	}

    /**
	 * Slide in Canny
	 *
     * @param target
     */

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

    /**
	 * Slide out Canny
	 *
     * @param target
     */

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

    /**
	 * Searches submenus
	 *
     * @param $this
     * @param layers
     */

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

    /**
	 * Mousedown event
	 *
     * @param e
     * @param $this
     */
	
	function naviEventDown(e, $this) {
		clickedPointX = (e.pageX || e.originalEvent.touches[0].pageX);
		clickedPointY = (e.pageY || e.originalEvent.touches[0].pageY);
		$this.data('mousedown', true);
	}

    /**
	 * Mouseup event
	 *
     * @param e
     * @param $this
     */

	function naviEventUp(e, $this) {
		$this.data('mousedown', false);
		$this.data('orientationOfMovement', null);
	}

    /**
	 * Get orientation of mouse movement
	 *
     * @param e
     * @param $this
     */
	
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

    /**
	 * Check direction of mouse movement
	 *
     * @param e
     * @param $this
     */

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

    /**
	 * Drag menu with mouse
	 *
     * @param e
     * @param $this
     */
	
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

    /**
	 * Close navi when dragged
	 *
     * @param e
     * @param $this
     */

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

    /**
	 * Submenu toggle
	 * opens and closes submenus depending on activated layers-option and clicked target
	 *
     * @param e
     * @param $this
     */

	function toggleSubmenus(e, $this) {
		if($this.data('orientationOfMovement') == null) {
			var toggle = $($(e.target).is('SPAN') ? e.target.parentNode : e.target);
			var $parent = toggle.parent();
			var $sub;

			// If layers are off.
			// Opens submenu, if the toggle is clicked.
			if($this.data('layers') == false) {
				if($parent.hasClass('with-toggle') && toggle.is('BUTTON')) {
					$sub = $parent.find('.canny-submenu').first();

					if($sub.hasClass('canny-sub-visible') == true) {
						$sub.removeClass('canny-sub-visible');
						$parent.removeClass('canny-sub-open');
					} else {
						$sub.addClass('canny-sub-visible');
						$parent.addClass('canny-sub-open');
					}
				}
			}

			// If layers are on.
			// Click on option with submenu opens submenu.
			if($this.data('layers') == true) {
				if($parent.hasClass('canny-parent')) {
					e.preventDefault();
					$sub = $parent.find('.canny-submenu').first();
					$sub.addClass('canny-sub-visible');
					$parent.addClass('canny-sub-open');
				}

				if($parent.hasClass('canny-back') == true) {
					$parent.parent().removeClass('canny-sub-visible');
					$parent.parents('.canny-parent').removeClass('canny-sub-open');
				}
			}
		}
	}

    /**
	 * Main Canny object
	 *
     * @type {{init: Canny.init, events: Canny.events, open: Canny.open, close: Canny.close, unCanny: Canny.unCanny, _transition: Canny._transition, _noTransition: Canny._noTransition}}
     */

	Canny.prototype = {
		init: function() {
			_self = this;
			_navi = this.el;
			_toggle = $(this.options.navToggle);
			_toggle.data('target', _navi);

			_navi.addClass('canny');

			_navi.data('this', _navi);
			_navi.data('status', 'closed');
			_navi.data('orientationOfMovement', null);
			_navi.data('directionOfMovement', null);

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
			_navi.data('useCloseButton', this.options.useCloseButton);
			_navi.data('closeButton', this.options.closeButton);
			_navi.data('closeButtonLabel', this.options.closeButtonLabel);
			_navi.data('dragToClose', this.options.dragToClose);
			_navi.data('layers', this.options.layers);
			_navi.data('backButtonLabel', this.options.backButtonLabel);
			_navi.data('copyParentLink', this.options.copyParentLink);

			setupCanny(_navi);

			if(this.options.useCloseButton == true) {
				_closeBtn = $(this.options.closeButton);
				_closeBtn.data('target', _navi);
			}

			_navi.data('width', _navi.outerWidth());
			_navi.data('height', _navi.outerHeight());

			alignOutside(_navi);

			console.log(_navi.data('height'));

			this.events(_navi);
		},

		events: function(_this) {
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

			if(_self.options.useCloseButton == true) {
				_closeBtn.on('click', 'button', function() {
					_self.close($(this).parent().data('target'));
				});
			}

			_this.on({
				dragstart: function(e) {
					// stops dragging of html elements
					e.preventDefault();
				},
				mousedown: function(e) {
					naviEventDown(e, $(this));
				},
				mouseup: function(e) {

				},
				touchstart: function(e) {
					naviEventDown(e, $(this));
				},
				touchend: function(e) {

				}
			});

			_this.on('click touchend', 'a, button', function(e) {
				toggleSubmenus(e, _this.data('this'));
			});

			if(_self.options.dragToClose == true) {
				_this.on({
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
				_this.on({
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

    /**
	 * Returns object
	 *
     * @param options
     * @returns {*}
     */

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