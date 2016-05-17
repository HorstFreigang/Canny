# Canny

## Usage

Include the jQuery and Canny  
```html
<script src="jquery.js"></script>  
<script src="jquery-canny.js"></script>
```
Include CSS  
```html
<link href="canny.css" rel="stylesheet" />
```

Markup
```html
<html>
  <head>
    <title>Canny Demo</title>
    <script src="jquery.js"></script>
    <script src="jquery-canny.js"></script>
    <link href="canny.css" rel="stylesheet" />
  </head>
  
  <body>
    <!-- Default page content -->
    <div id="container">
      <button id="canny-toggle">Menu</button>
      <!-- Content -->
    </div>
    
    <!-- Canny -->
    <ul id="canny">
      <li><a href="">Link 1</a></li>
      <li>
        <a href="">Link 2</a>
        <ul>
          <li><a href="">Link 2 1</a></li>
          <li><a href="">Link 2 2</a></li>
          <li><a href="">Link 2 3</a></li>
        </ul>
      </li>
      <li><a href="">Link 3</a></li>
      <li><a href="">Link 4</a></li>
    </ul>
  </body>
</html>
```

jQuery

```js
$(function() {
  var myCanny = $('#canny').canny({
    contentWrap: '#container',
    navToggle: '#canny-toggle'
  });
});
```

## Options

**cannyParent**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``null``

The element that contains Canny and ``contentWrap``, if it is empty Canny searches for the nearest parent. Set this option if Canny is wrapped by an element. This option needs to be set correctly, if ``fixedView`` is ``true``.

- - - -

**contentWrap**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``''``

This is the element that contains the content. It **must not contain** Canny. It needs to be set if you want to use ``pushContent``.

- - - -

**openClass**

**Value:** Class name  
**Default:** ``'canny-open'``

The class that ``cannyParent`` gets when Canny is open.

- - - -

**openingClass**

**Value:** Class name  
**Default:** ``'canny-opening'``

The class that ``cannyParent`` and ``overlay`` are getting when Canny is opening.

- - - -

**closingClass**

**Value:** Class name  
**Default:** ``'canny-closing'``

The class that ``cannyParent`` and ``overlay`` are getting when Canny is closing.

- - - -

**pushContent**

**Value:** ``true`` or ``false``  
**Default:** ``false``

If ``pushContent`` is ``true`` then ``contentWrap`` is pushed sideways with Canny.

- - - -

**fixedView**

**Value:** ``true`` or ``false``  
**Default:** ``true``

If ``true`` the page can not be scrolled when Canny is open. It works marvelouse with a desktop browser, but is buggy on mobile devices, because of the way the viewport works there.

- - - -

**layers**

**Value:** ``true`` or ``false``  
**Default:** ``false``

Sub-menus will open as layers on top of each other. A back-button is added automatically to every sub-menu.

- - - -

**navOffset**

**Value:** Number  
**Default:** ``0``

If the value is greater then 0 Canny is visible by the amount of the value in pixels. Useful if you want to add a toggle within Canny.

- - - -

**navToggle**

**Value:** ID or Class (e.g.: ``'#container'`` or ``'.container'``)  
**Default:** ``''``

The element that opens and closes Canny.

- - - -

**navPosition**

**Value:** ``'left'``, ``'top'`` or ``'right'``
**Default:** ``'left'``

Position of the menu. You can place Canny on the left, right or top side. If Canny is placed on top, set ``fixedView`` to ``false``.

- - - -

**transitionSpeed**

**Value:** Number (in miliseconds)  
**Default:** ``300``

How fast Canny slides in and out.

- - - -

**dragToClose**

**Value:** ``true`` or ``false``  
**Default:** ``false``

Close Canny by dragging it. Currently only works with ``navPosition: 'left'`` and ``navPosition: 'right'``.

- - - -

**threshold**

**Value:** ``'default'`` or Number  
**Default:** ``300``

How far Canny needs to get dragged until it closes. ``'default'`` sets the distance to the half of Canny's width.

- - - -

**overlay**

**Value:** ``true`` or ``false``  
**Default:** ``false``

Enables the overlay.

- - - -

**closeButton**

**Value:** ``true`` or ``false``  
**Default:** ``false``

Enables a close-button in Canny.

- - - -

**closeButtonLabel**

**Value:** String  
**Default:** ``'<span>Close</span>'``

Sets the label of the close-button.

- - - -

**backButtonLabel**

**Value:** String  
**Default:** ``'&laquo; Back'``

Changes the label of the back-button.

- - - -

**copyParentLink**

**Value:** ``true`` or ``false``  
**Default:** ``false``

Copies parent-link to sub-menu.
